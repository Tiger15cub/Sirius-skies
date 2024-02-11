export default function WaitingState(): string {
  return JSON.stringify({
    payload: {
      totalPlayers: (global as any).MMClients.length,
      connectedPlayers: (global as any).MMClients.length,
      state: "Waiting",
    },
    name: "StatusUpdate",
  });
}
