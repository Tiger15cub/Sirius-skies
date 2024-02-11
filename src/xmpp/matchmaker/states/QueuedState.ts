import { AuthorizationPayload } from "../../../interface";
import { v4 as uuid } from "uuid";

export default function QueuedState(): string {
  const user = (global as any).MMUser;
  const ticket = uuid().replace(/-/g, "");

  user.forEach((userData: AuthorizationPayload) => {
    const etaAndQueuedPlayers = (global as any).MMUser.reduce(
      (count: number, data: AuthorizationPayload) => {
        if (
          data.playlist === userData.playlist &&
          data.region === userData.region &&
          data.customKey === userData.customKey &&
          data.buildId === userData.buildId
        ) {
          return count + 1;
        } else {
          return count;
        }
      },
      0
    );

    if (userData.customKey !== "NONE") {
      // TODO
    }

    return JSON.stringify({
      payload: {
        ticketId: ticket,
        queuedPlayers: etaAndQueuedPlayers,
        estimatedWaitSec: etaAndQueuedPlayers * 2,
        status: etaAndQueuedPlayers === 0 ? 2 : 3,
        state: "Queued",
      },
      name: "StatusUpdate",
    });
  });

  return "";
}
