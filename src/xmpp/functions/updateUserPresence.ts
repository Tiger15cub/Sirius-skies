import xmlbuilder from "xmlbuilder";
import log from "../../utils/log";
import { Globals } from "../types/XmppTypes";

export default function updateUserPresence(
  senderId: string,
  receiverId: string,
  isOffline: boolean
): void {
  const sender = Globals.Clients.find(
    (client) => client.accountId === Globals.accountId
  );
  const client = Globals.Clients.find(
    (client) => client.accountId === Globals.accountId
  );

  if (!client || !sender) return;

  let xml = xmlbuilder
    .create("presence")
    .attribute("to", client.jid)
    .attribute("xmlns", "jabber:client")
    .attribute("from", sender.jid)
    .attribute("type", isOffline ? "unavailable" : "available");

  if (sender.lastPresenceUpdate?.away)
    xml = xml
      .element("show", "away")
      .up()
      .element("status", sender.lastPresenceUpdate.status)
      .up();
  else xml = xml.element("status", sender.lastPresenceUpdate?.status).up();

  client.socket?.send(xml.toString({ pretty: true }));
}
