import WebSocket from "ws";

export default async function SessionAssignment(
  socket: WebSocket,
  matchId: string
) {
  socket.send(
    JSON.stringify({
      payload: {
        matchId,
        state: "SessionAssignment",
      },
      name: "StatusUpdate",
    })
  );
}
