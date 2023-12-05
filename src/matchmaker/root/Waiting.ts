import WebSocket from "ws";

export default async function Waiting(socket: WebSocket, clients: number) {
  socket.send(
    JSON.stringify({
      payload: {
        totalPlayers: clients,
        connectedPlayers: clients,
        state: "Waiting",
      },
      name: "StatusUpdate",
    })
  );
}
