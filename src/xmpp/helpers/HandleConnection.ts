import WebSocket from "ws";
import express from "express";
import { v4 as uuid } from "uuid";
import { Saves } from "../types/Saves";
import { Globals } from "../types/XmppTypes";
import HandleMessage from "./HandleMessage";
import log from "../../utils/log";

const id = uuid();

export default {
  async handleConnection(socket: WebSocket, request: express.Request) {
    if (request.url === "//") {
      try {
        Saves.ConnectedClients.set(id, socket);

        socket.on("close", () => {
          Saves.ConnectedClients.delete(id);

          const clientIndex = Globals.Clients.findIndex(
            (client) => client.socket === socket
          );
          const client = Globals.Clients.find((c) => c.socket === socket);

          if (!client) return;

          if (clientIndex !== -1) {
            Globals.Clients.splice(clientIndex, 1);
          }

          log.custom(
            `XMPP Client with the displayName ${client.displayName}`,
            "XMPP"
          );
        });

        Saves.ConnectedClients.set(id, socket);
        await HandleMessage.handleMessage(socket, request, id);
      } catch (error) {
        log.error(`Error handling message: ${error}`, "XMPP");
      }
    } else {
      socket.close(4000, "Invalid WebSocket request.");
    }
  },
};
