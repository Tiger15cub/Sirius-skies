import WebSocket from "ws";
import { RemoveClient } from "../helpers/RemoveClient";
import { Globals } from "../helpers/XmppTypes";
import XmppClient from "../client/XmppClient";

export default async function HandleClose(socket: WebSocket) {
  socket.on("close", () => {
    RemoveClient(Globals.Clients[0].socket as XmppClient);
  });
}
