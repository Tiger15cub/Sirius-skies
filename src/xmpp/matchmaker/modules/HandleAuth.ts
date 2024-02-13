import WebSocket from "ws";
import { IncomingHttpHeaders } from "http";
import log from "../../../utils/log";
import { decryptAES256 } from "../../../api/matchmaking";
import { getEnv } from "../../../utils";
import Users from "../../../models/Users";
import { AuthorizationPayload } from "../../../interface";
import { DateTime } from "luxon";
import Accounts from "../../../models/Accounts";

export default {
  async handleAuth(
    socket: WebSocket,
    headers: IncomingHttpHeaders
  ): Promise<any> {
    try {
      if (
        !headers.authorization ||
        !headers.authorization.includes("Epic-Signed") ||
        !headers.authorization.includes("mms-player")
      )
        return socket.close(3000);

      if (headers.authorization) {
        const authorizationHeader = headers.authorization.toString();

        const base64Regex =
          /([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)/g;
        const base64Matches = authorizationHeader.match(base64Regex);

        if (base64Matches && base64Matches.length > 0) {
          const authorizationToken: string = base64Matches[0];

          const decryptedToken: string = decryptAES256(
            authorizationToken,
            getEnv("CLIENT_SECRET")
          );

          const payload: AuthorizationPayload = JSON.parse(decryptedToken);

          const user = await Users.findOne({
            accountId: payload.accountId,
          }).cacheQuery();

          const account = await Accounts.findOne({
            accountId: payload.accountId,
          }).cacheQuery();

          if (!user || !account) {
            socket.terminate();
            return null;
          }
          if (user.banned || account.banned) {
            socket.terminate();
            return null;
          }

          const tokenTimestamp: DateTime = DateTime.fromISO(payload.timestamp);

          if (tokenTimestamp.isValid) {
            const currentUtcTime: DateTime = DateTime.utc();
            const tokenLifetimeThreshold: number = 24 * 60 * 60 * 1000;

            if (
              currentUtcTime.diff(tokenTimestamp).milliseconds <=
              tokenLifetimeThreshold
            ) {
              if (account.accessToken.includes(payload.accessToken)) {
                return payload;
              }
              return payload;
            } else {
              log.info(
                `${user.username}'s token has expired. Disconnecting...`,
                "HandleAuth"
              );
              return socket.terminate();
            }
          }

          return payload;
        }
      }
      return null;
    } catch (error) {
      log.error(
        `An error occured when trying to HandleAuth: ${error}`,
        "HandleAuth"
      );
      socket.terminate();
      return null;
    }
  },
};
