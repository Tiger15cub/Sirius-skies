import WebSocket from "ws";
import { IncomingMessage } from "http";
import { Saves } from "../types/Saves";
import xmlparser from "xml-parser";
import open from "../roots/open";
import { Globals } from "../types/XmppTypes";
import auth from "../roots/auth";
import log from "../../utils/log";
import iq from "../roots/iq";
import presence from "../roots/presence";

export default {
  async handleMessage(
    socket: WebSocket,
    request: IncomingMessage,
    id: string
  ): Promise<void> {
    let document: xmlparser.Document;

    socket.on("message", async (chunk: WebSocket.Data | string) => {
      if (Buffer.isBuffer(chunk)) chunk = chunk.toString();

      Saves.Received += chunk;

      document = xmlparser(Saves.Received);

      if (!document) {
        log.error("An Error has occured.", "XMPP");
      }

      switch (document.root.name) {
        case "open":
          await open(socket, Globals.isAuthenticated, id);
          break;

        case "auth":
          await auth(socket, document.root, id);
          break;

        case "iq":
          await iq(socket, document.root, id);
          break;

        case "presence":
          await presence(socket, document.root, id);
          break;
      }

      if (!Saves.clientExists && socket.readyState === WebSocket.OPEN) {
        const resource = Saves.resource;
        if (
          Globals.accountId !== "" &&
          Globals.displayName !== "" &&
          Globals.token !== "" &&
          Globals.jid !== "" &&
          id !== "" &&
          resource !== "" &&
          Globals.isAuthenticated
        ) {
          Globals.Clients.push({
            accountId: Globals.accountId,
            displayName: Globals.displayName,
            token: Globals.token,
            jid: Globals.jid,
            resource: Saves.resource,
            lastPresenceUpdate: {
              away: false,
              status: "{}",
            },
            socket,
          });

          Saves.clientExists = true;
        }
      }
      Saves.Received = "";
    });
  },
};
