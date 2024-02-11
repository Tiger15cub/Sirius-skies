export default function ConnectingState(): string {
  return JSON.stringify({
    payload: {
      state: "Connecting",
    },
    name: "StatusUpdate",
  });
}
