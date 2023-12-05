import WebSocket, { Server } from "ws";

export default async function Connecting(socket: WebSocket) {
  socket.send(
    JSON.stringify({
      payload: {
        state: "Connecting",
      },
      name: "StatusUpdate",
    })
  );
}
