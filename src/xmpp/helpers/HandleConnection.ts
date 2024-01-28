import WebSocket from "ws";
import express from "express";
import { Saves } from "../types/Saves";
import HandleMessage from "./HandleMessage";
import log from "../../utils/log";

export default {
  handleConnection(socket: WebSocket, id: string, request: express.Request) {
    if (request.url === "//") {
      try {
        Saves.ConnectedClients.set(id, socket);
        HandleMessage.handleMessage(socket, request, id);
      } catch (error) {
        log.error(`Error handling connection: ${error}`, "XMPP");
      }
    }
  },
};