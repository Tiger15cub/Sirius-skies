import WebSocket from "ws";

export default async function Join(
  socket: WebSocket,
  matchId: string,
  sessionId: string
) {
  socket.send(
    JSON.stringify({
      payload: {
        matchId,
        sessionId,
        joinDelaySec: 1,
      },
      name: "Play",
    })
  );
}
