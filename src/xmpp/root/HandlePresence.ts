import WebSocket from "ws";
import xmlparser from "xml-parser";
import { parseMessageContent } from "./HandleAuth";
import { Globals, XmppClients } from "../helpers/XmppTypes";
import UpdatePresenceForFriends from "../helpers/UpdatePresenceForFriends";

export default async function HandlePresence(
  socket: WebSocket,
  message: xmlparser.Node,
  accountId: string,
  jid: string,
  sender: NodeJS.Timeout
) {
  const { attributes, children } = message;
  let domain: string = "@muc.prod.ol.epicgames.com";

  console.debug(accountId);

  UpdatePresenceForFriends(socket, jid, accountId, message);

  sender = setInterval(() => {
    UpdatePresenceForFriends(socket, jid, accountId, message);
  }, 30000);

  switch (attributes.type) {
    case "unavailable":
      const to = attributes.to.toLowerCase();
      console.debug(to);

      if (to.endsWith(domain) || to.split("/")[0].endsWith(domain)) {
        const roomName = to.split("@")[0];

        if (!Globals.MUCs[roomName]) return;
        console.debug(roomName);
        console.debug(JSON.stringify(Globals.MUCs));
        console.debug(JSON.stringify(Globals.MUCs[roomName]));
      }
      break;

    default:
  }
}
