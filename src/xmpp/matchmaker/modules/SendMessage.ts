import WebSocket from "ws";
import log from "../../../utils/log";

export default async function SendMessage(
  socket: WebSocket,
  message: string,
  delayMs: number
): Promise<void> {
  try {
    if (socket.readyState !== WebSocket.OPEN) return;

    const bytes = Buffer.from(message, "utf-8");

    await new Promise<void>((resolve) => {
      socket.send(bytes, (error?: Error) => {
        if (error) {
          log.error(`Failed to SendMessage: ${error}`, "Matchmaker");
          socket.terminate();
          return;
        }

        setTimeout(resolve, delayMs);
      });
    });
  } catch (error) {
    log.error(
      `An Error occured while trying to SendMessage: ${error}`,
      "Matchmaker"
    );
  }
}
