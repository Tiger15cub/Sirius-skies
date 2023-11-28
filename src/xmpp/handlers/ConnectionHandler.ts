import WebSocket from "ws";
import { RemoveClient } from "../utils/RemoveClient";
import XmppClient from "../client/XmppClient";
import log from "../../utils/log";

export async function handleConnection(
  ws: WebSocket,
  handleClose: (clientId: string) => void
): Promise<void> {
  const Client = new XmppClient(ws);

  ws.on("close", async () => {
    RemoveClient(Client, handleClose);
  });
}
