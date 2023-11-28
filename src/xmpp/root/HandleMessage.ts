import xmlparser from "xml-parser";
import xmlbuilder from "xmlbuilder";
import WebSocket from "ws";
import log from "../../utils/log";
import { Globals } from "../utils/XmppTypes";

export default async function HandleMessage(
  socket: WebSocket,
  jid: string,
  message: xmlparser.Node
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const { attributes, children } = message;

      switch (attributes.type) {
        case "chat":
          let receiver = Globals.Clients.find(
            (data) => data.socket?.jid.split("/")[0] === attributes.to
          );

          if (!receiver) return;

          socket.send(
            xmlbuilder
              .create("message")
              .attribute("to", receiver.socket?.jid)
              .attribute("from", jid)
              .attribute("xmlns", "jabber:client")
              .attribute("type", "chat")
              .element("body", children[0].content)
              .up()
              .toString()
          );
          break;
        case "groupchat":
          if (!Globals.MUCs[attributes.to.split("@")[0]]) return;

          Globals.MUCs[attributes.to.split("@")[0]];

          return;
      }

      resolve();
    } catch (error) {
      let err: Error = error as Error;
      log.error(`Failed to handle Message: ${err.message}`, "HandleMessage");
      reject(error);
    }
  });
}
