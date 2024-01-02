import WebSocket from "ws";
import { IncomingMessage } from "http";
import { Received } from "../types/Saves";
import xmlparser from "xml-parser";
import open from "../roots/open";
import { Globals } from "../types/XmppTypes";
import auth from "../roots/auth";
import log from "../../utils/log";

export default {
  async handleMessage(
    socket: WebSocket,
    request: IncomingMessage,
    id: string
  ): Promise<void> {
    let document: xmlparser.Document;

    let received: string = Received;

    socket.on("message", async (chunk: WebSocket.Data | string) => {
      if (Buffer.isBuffer(chunk)) chunk = chunk.toString();

      received += chunk;

      document = xmlparser(received);

      if (!document) {
        log.error("An Error has occured.", "XMPP");
      }

      switch (document.root.name) {
        case "open":
          open(socket, Globals.isAuthenticated, id);
          break;

        case "auth":
          auth(socket, document.root, id);
          break;
      }

      received = "";
    });

    socket.on("close", async () => {
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CLOSING
      ) {
        await socket.close(0, "WebSocket Connection has been terminated.");
      }
      socket.terminate();
    });
  },
};
