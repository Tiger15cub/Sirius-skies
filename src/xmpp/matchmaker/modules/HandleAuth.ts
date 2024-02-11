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
  ): Promise<AuthorizationPayload | null> {
    try {
      if (headers.authorization) {
        const authorizationHeader = headers.authorization.toString();
        const authorizationHeaderParts = authorizationHeader.split(" ");
        const tokenIndex: number = 3;

        if (authorizationHeaderParts.length >= tokenIndex + 1) {
          const authorizationToken: string =
            authorizationHeaderParts[tokenIndex];
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
              // works for now
              if (account.accessToken.token.includes(payload.accessToken)) {
                return payload;
              }
            } else {
              log.info(
                `${user.username}'s token has expired. Disconnecting...`,
                "Matchmaker"
              );
            }
          }
        }
      }

      socket.terminate();
      return null;
    } catch (error) {
      log.error(
        `An error occured when trying to HandleAuth: ${error}`,
        "Matchmaker"
      );
      socket.terminate();
      return null;
    }
  },
};
