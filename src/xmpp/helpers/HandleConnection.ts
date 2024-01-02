import WebSocket from "ws";
import express from "express";
import { v4 as uuid } from "uuid";
import { ConnectedClients } from "../types/Saves";
import { Globals } from "../types/XmppTypes";
import HandleMessage from "./HandleMessage";

const id = uuid();

export default {
  async handleConnection(socket: WebSocket, request: express.Request) {
    if (request.url === "//") {
      ConnectedClients.set(id, socket);

      await HandleMessage.handleMessage(socket, request, id);

      ConnectedClients.delete(id);

      const clientIndex = Globals.Clients.findIndex(
        (client) => client.socket === socket
      );

      if (clientIndex !== -1) {
        Globals.Clients.splice(clientIndex, 1);
      }
    } else {
      socket.close(4000, "Invalid WebSocket request.");
    }
  },
};
