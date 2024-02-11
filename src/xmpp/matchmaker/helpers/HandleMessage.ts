import HandleAuth from "../modules/HandleAuth";
import WebSocket from "ws";
import express from "express";
import { IncomingHttpHeaders } from "http";
import log from "../../../utils/log";
import SendMessage from "../modules/SendMessage";
import ConnectingState from "../states/ConnectingState";
import WaitingState from "../states/WaitingState";
import QueuedState from "../states/QueuedState";

export default {
  async handleMessage(
    socket: WebSocket,
    request: express.Request,
    headers: IncomingHttpHeaders
  ) {
    (global as any).MMClients.push({
      socket,
    });

    while (socket.readyState === WebSocket.OPEN) {
      const authorization = await HandleAuth.handleAuth(socket, headers);

      const connectingState = await SendMessage(socket, ConnectingState(), 200);
      const waitingState = await SendMessage(socket, WaitingState(), 1000);

      await Promise.all([connectingState, waitingState]);

      if (authorization === null) continue;

      (global as any).MMUser.push({
        socket,
        playlist: authorization.playlist,
        buildId: authorization.buildId,
        region: authorization.region,
        accountId: authorization.accountId,
        customKey: authorization.customKey,
      });

      const queuedState = await SendMessage(socket, QueuedState(), 10000);

      await Promise.all([queuedState]);

      break;
    }

    if (socket.readyState === WebSocket.CLOSED) socket.terminate();

    do {
      socket.on("message", async (chunk: WebSocket.Data | string) => {
        try {
          if (Buffer.isBuffer(chunk)) chunk = chunk.toString();

          chunk = await new Promise((resolve) => {
            return resolve(chunk);
          });

          log.debug(`Received Message: ${chunk}`, "Matchmaker");
        } catch (error) {
          log.error(`Error handling message: ${error}`, "Matchmaker");
        }
      });
    } while (socket.readyState === WebSocket.OPEN);
  },
};
