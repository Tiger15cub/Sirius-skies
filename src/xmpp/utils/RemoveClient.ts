import Users from "../../models/Users";
import log from "../../utils/log";
import XmppClient from "../client/XmppClient";
import { SendUnavailablePresence } from "../root/UnavailablePresence";
import { Globals, XmppClients } from "./XmppTypes";

export async function RemoveClient(client: XmppClient): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await Users.findOne({
        accountId: client.accountId,
      }).lean();

      if (user) {
        const { accepted } = user.friends;
        await Promise.all(
          accepted.map(async (friend) => {
            const friendClients = Globals.Clients[friend.id];
            if (Array.isArray(friendClients) && friendClients.length > 0) {
              const jids = friendClients
                .map((data) => data.socket?.jid as string)
                .toString();
              await SendUnavailablePresence(client, jids);
            }
          })
        );
      }

      if (client.sender) {
        clearInterval(client.sender);
      }

      if (Array.isArray(Globals.Clients)) {
        Globals.Clients = (Globals.Clients as XmppClients[]).filter(
          (data) => data.accountId !== client.accountId
        );
      }
      resolve();
    } catch (error) {
      let err: Error = error as Error;
      log.error(`Error removing client: ${err.message}`, "RemoveClient");
      reject(error);
    }
  });
}
