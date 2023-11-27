import Users from "../../models/Users";
import log from "../../utils/log";
import XmppClient from "../client/XmppClient";
import { SendUnavailablePresence } from "../root/UnavailablePresence";
import { Globals } from "./XmppTypes";

export async function RemoveClient(
  client: XmppClient,
  handleClose: (clientId: string) => void
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await Users.findOne({
        accountId: client.accountId,
      }).lean();

      if (user) {
        const { accepted } = user.friends;
        await Promise.all(
          accepted.map(async (friend) => {
            if (Globals.Clients[friend.id])
              await SendUnavailablePresence(
                client,
                Globals.Clients[friend.id]
                  .map((data) => data.socket?.jid as string)
                  .toString()
              );
          })
        );
      }

      if (!client.sender) {
        clearInterval(client.sender);
      }

      if (Globals.Clients[client.accountId])
        delete Globals.Clients[client.accountId];

      if (Globals.Clients[client.accountId])
        delete Globals.Clients[client.accountId];

      resolve();
    } catch (error) {
      let err: Error = error as Error;
      log.error(`Error removing client: ${err.message}`, "RemoveClient");
      reject(error);
    }
  });
}
