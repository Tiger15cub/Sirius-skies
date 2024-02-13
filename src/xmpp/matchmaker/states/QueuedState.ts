import { DateTime } from "luxon";
import { AuthorizationPayload } from "../../../interface";
import crypto from "node:crypto";
import WebSocket from "ws";

(global as any).queuedPlayers = 0;

export default async function QueuedState(socket: WebSocket): Promise<string> {
  const users: AuthorizationPayload[] = (global as any).MMUser;
  const ticket: string = crypto
    .createHash("md5")
    .update(`1${DateTime.now()}`)
    .digest("hex");

  const userMap = new Map<string, number>();

  users.forEach((userData) => {
    const key = `${userData.playlist}-${userData.region}-${userData.customKey}-${userData.buildId}`;
    const count = userMap.get(key) || 0;
    userMap.set(key, count + 1);
  });

  users.map((userData) => {
    const key = `${userData.playlist}-${userData.region}-${userData.customKey}-${userData.buildId}`;
    const matches = userMap.get(key) || 0;
    const estimatedWaitSec = matches * 2;

    (global as any).queuedPlayers += matches;

    if ((global as any).queuedPlayers >= 100) return socket.terminate();

    setTimeout(() => {
      return {
        payload: {
          ticketId: ticket,
          queuedPlayers: matches,
          estimatedWaitSec: estimatedWaitSec,
          status: {},
          state: "Queued",
        },
        name: "StatusUpdate",
      };
    }, 2000);
  });

  await sleep(2000);

  return "";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
