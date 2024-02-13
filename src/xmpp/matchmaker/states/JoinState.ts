import crypto from "crypto";
import { IServer } from "../../../models/Servers";

export default function JoinState(lowestPlayerCountServer: IServer): string {
  const md5 = crypto.createHash("md5");
  const matchId = md5.update("2", "utf8").digest("hex");

  return JSON.stringify({
    payload: {
      matchId,
      sessionId: lowestPlayerCountServer.sessionId,
      joinDelaySec: 3,
    },
    name: "Play",
  });
}
