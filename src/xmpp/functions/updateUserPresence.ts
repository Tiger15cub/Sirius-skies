import xmlbuilder from "xmlbuilder";
import log from "../../utils/log";
import { Globals, XmppClients } from "../types/XmppTypes";
import { findInIterable } from "./findInIterable";

export default function updateUserPresence(
  senderId: string,
  receiverId: string,
  isOffline: boolean
): void {
  const sender = findInIterable(
    Globals.Clients,
    (client) => client.accountId === senderId
  );
  const receiver = findInIterable(
    Globals.Clients,
    (client) => client.accountId === receiverId
  );
  const presenceType = isOffline ? "unavailable" : "available";

  if (!receiver || !sender) {
    log.error(`Receiver or Sender not found.`, "updatePresence");
    return;
  }

  const presence = xmlbuilder
    .create("presence")
    .attribute("to", receiver.jid)
    .attribute("xmlns", "jabber:client")
    .attribute("from", sender.jid)
    .attribute("type", presenceType);

  presence
    .element("show", sender.lastPresenceUpdate?.away ? "away" : undefined)
    ?.up()
    .element("status", sender.lastPresenceUpdate?.status) ?? presence.up();

  if (receiver.socket) {
    receiver.socket.send(presence.toString());
  }
}
