import WebSocket from "ws";
import { RemoveClient } from "../utils/RemoveClient";
import XmppClient from "../client/XmppClient";

export async function handleConnection(ws: WebSocket): Promise<void> {
  new XmppClient(ws);

  ws.on("close", async () => {
    RemoveClient(new XmppClient(ws));
  });
}
