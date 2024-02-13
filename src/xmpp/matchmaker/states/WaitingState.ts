export default function WaitingState(): string {
  console.log((global as any).queuedPlayers);
  console.log((global as any).MMClients.length);

  return JSON.stringify({
    payload: {
      totalPlayers: (global as any).queuedPlayers,
      connectedPlayers: (global as any).queuedPlayers,
      state: "Waiting",
    },
    name: "StatusUpdate",
  });
}
