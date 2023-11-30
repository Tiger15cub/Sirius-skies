import WebSocket from "ws";
import log from "../../utils/log";
import xmlparser from "xml-parser";
import xmlbuilder from "xmlbuilder";

export default async function HandleIQ(
  socket: WebSocket,
  acocuntId: string,
  jid: string,
  message: xmlparser.Node
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const { attributes, children } = message;
      const { id } = attributes;

      switch (id) {
        case "_xmpp_bind1":
          const to =
            attributes.to ||
            `${acocuntId}@prod.ol.epicgames.com/${
              children.find((data) => data.name === "bind")?.children[0].content
            }`;

          jid = to;

          socket.send(
            xmlbuilder
              .create("iq")
              .attribute("to", jid)
              .attribute("id", "_xmpp_bind1")
              .attribute("xmlns", "jabber:client")
              .attribute("type", "result")
              .element("bind")
              .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-bind")
              .element("jid", jid)
              .up()
              .toString()
          );
          break;
        case "_xmpp_session1":
          socket.send(
            xmlbuilder
              .create("iq")
              .attribute("to", jid)
              .attribute("from", "prod.ol.epicgames.com")
              .attribute("id", "_xmpp_session1")
              .attribute("xmlns", "jabber:client")
              .attribute("type", "result")
              .toString()
          );
          console.debug(id);
          break;

        default:
          socket.send(
            xmlbuilder
              .create("iq")
              .attribute("to", jid)
              .attribute("from", "prod.ol.epicgames.com")
              .attribute("id", id)
              .attribute("xmlns", "jabber:client")
              .attribute("type", "result")
              .toString()
          );
          break;
      }

      resolve();
    } catch (error) {
      let err: Error = error as Error;
      log.error(`Failed to handle IQ: ${err.message}`, "HandleIQ");
      reject(error);
    }
  });
}
