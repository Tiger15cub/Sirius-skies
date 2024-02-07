import { DateTime } from "luxon";
import { Globals } from "../xmpp/types/XmppTypes";
import xmlbuilder from "xmlbuilder";
import log from "./log";

export default async function sendXmppMessageToClient(
  payload: any,
  accountId: string
): Promise<void> {
  const client = (global as any).Clients.find(
    (client: any) => client.accountId === accountId
  );
  if (!client) return;

  client.socket?.send(
    xmlbuilder
      .create("message")
      .attribute("from", "xmpp-admin@prod.ol.epicgames.com")
      .attribute("to", client.jid)
      .attribute("xmlns", "jabber:client")
      .element("body", JSON.stringify(payload))
      .up()
      .toString({ pretty: true })
  );
}
