import WebSocket from "ws";
import express from "express";
import { Saves } from "../types/Saves";
import HandleMessage from "./HandleMessage";
import log from "../../utils/log";

export default {
  async handleConnection(
    socket: WebSocket,
    id: string,
    request: express.Request
  ) {
    if (request.url === "//") {
      try {
        Saves.ConnectedClients.set(id, socket);
        await HandleMessage.handleMessage(socket, request, id);
        Saves.ConnectedClients.set(id, socket);
      } catch (error) {
        log.error(`Error handling message: ${error}`, "XMPP");
      }
    }
  },
};
