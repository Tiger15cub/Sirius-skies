import xmlparser from "xml-parser";
import { Globals } from "../types/XmppTypes";
import xmlbuilder from "xmlbuilder";

export function SendMessageToClient(
  jid: string,
  body: string,
  parsedMessage: xmlparser.Document
) {
  const { root } = parsedMessage;
  const { attributes } = root;

  const clientReceiver = Globals.Clients.find(
    (client) =>
      client.jid?.split("/")[0] === attributes.to ||
      client.jid === attributes.to
  );

  if (!clientReceiver) {
    return;
  }

  const messageXml = xmlbuilder
    .create("message")
    .attribute("from", jid)
    .attribute("id", attributes.id)
    .attribute("to", clientReceiver.jid)
    .attribute("xmlns", "jabber:client")
    .element("body", body);

  clientReceiver.socket.send(messageXml.up().toString());
}
