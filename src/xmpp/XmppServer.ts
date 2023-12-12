import { Server } from "ws";
import { getEnv } from "../utils";
import { Connection } from "./Connection";

const PORT = getEnv<number>("XMPP_PORT") || 5433;

function init(): void {
  const WebSocket = new Server({ port: PORT });

  WebSocket.on("connection", async (socket) => {
    Connection(socket);
  });
}

export { init };
