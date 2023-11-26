import { Server as WebSocketServer, WebSocket } from "ws";
import { getEnv } from "../utils";
import log from "../utils/log";
import { handleConnection } from "./handlers";

export default class XmppServer {
  private wss: WebSocketServer;

  constructor() {
    const port = getEnv<number>("XMPP_PORT") || 5433;
    this.wss = new WebSocketServer({ port }, () =>
      log.log(
        `Xmpp Listening on ws://127.0.0.1:${port}`,
        "XmppServer",
        "cyanBright"
      )
    );
    this.wss.on("connection", (ws) =>
      handleConnection(ws, this.handleClose.bind(this))
    );

    this.wss.on("error", (ws) => {});
  }

  private handleClose(clientId: string): void {
    log.log(
      `XMPP Connection closed for client with ID: ${clientId}`,
      "XmppServer",
      "redBright"
    );
  }
}
