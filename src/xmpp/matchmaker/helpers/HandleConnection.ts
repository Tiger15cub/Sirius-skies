import WebSocket from "ws";
import express from "express";
import log from "../../../utils/log";
import { IncomingHttpHeaders } from "http";
import HandleMessage from "./HandleMessage";

export default {
  async handleConnection(
    socket: WebSocket,
    request: express.Request,
    headers: IncomingHttpHeaders
  ) {
    if (request.url === "//") {
      try {
        await HandleMessage.handleMessage(socket, request, headers);
      } catch (error) {
        log.error(`Error handling connection: ${error}`, "Matchmaker");
      }
    }
  },
};
