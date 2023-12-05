import WebSocket from "ws";

export default async function Queued(
  socket: WebSocket,
  ticketId: string,
  clients: number
) {
  socket.send(
    JSON.stringify({
      payload: {
        ticketId,
        queuedPlayers: clients,
        estimatedWaitSec: 0,
        status: {},
        state: "Queued",
      },
      name: "StatusUpdate",
    })
  );
}
