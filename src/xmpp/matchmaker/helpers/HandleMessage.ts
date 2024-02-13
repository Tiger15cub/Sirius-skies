import HandleAuth from "../modules/HandleAuth";
import WebSocket from "ws";
import express from "express";
import { IncomingHttpHeaders } from "http";
import log from "../../../utils/log";
import SendMessage from "../modules/SendMessage";
import ConnectingState from "../states/ConnectingState";
import WaitingState from "../states/WaitingState";
import QueuedState from "../states/QueuedState";
import CheckServerAvailability from "../modules/CheckServerAvailability";

export default {
  async handleMessage(
    socket: WebSocket,
    request: express.Request,
    headers: IncomingHttpHeaders
  ) {
    (global as any).MMClients.push({
      socket,
    });

    const authorization = await HandleAuth.handleAuth(socket, headers);

    console.log(socket.readyState);

    while (socket.readyState === socket.OPEN) {
      try {
        const connectingState = await SendMessage(
          socket,
          ConnectingState(),
          200
        );
        const waitingState = await SendMessage(socket, WaitingState(), 1000);

        await Promise.all([connectingState, waitingState]);

        if (authorization === null) {
          socket.terminate();
          return;
        }

        (global as any).MMUser.push({
          socket,
          playlist: authorization.playlist,
          buildId: authorization.buildId,
          region: authorization.region,
          accountId: authorization.accountId,
          customKey: authorization.customKey,
        });

        const queuedState = await SendMessage(
          socket,
          await QueuedState(socket),
          10000
        );
        const serverAvailability = await CheckServerAvailability(
          socket,
          authorization
        );

        await Promise.all([queuedState, serverAvailability]);
        break;
      } catch (error) {
        log.error(`Error handling WebSocket message: ${error}`, "Matchmaker");
      }
    }

    if (socket.readyState === socket.CLOSING)
      return socket.close(1000, "WebSocket has been closed by Client.");

    if (socket.readyState === socket.CLOSED) return socket.terminate();

  socket.on("message", async (req: WebSocket.Data | string) => {
    try {
      let chunk: string =
        req instanceof Buffer ? req.toString() : (req as string);

      console.log(`Received Message: ${chunk}`, "Matchmaker");

      await new Promise<void>((resolve, reject) => {
        socket.once("message", resolve);
        socket.once("error", reject);
      });
    } catch (error) {
      console.error(`Error handling message: ${error}`, "Matchmaker");
    }
  });
  },
};
