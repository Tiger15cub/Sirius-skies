import crypto from "crypto";

export default function SessionAssignmentState(): string {
  const md5 = crypto.createHash("md5");
  const matchId = md5.update("2", "utf8").digest("hex");

  return JSON.stringify({
    payload: {
      matchId,
      state: "SessionAssignment",
    },
    name: "StatusUpdate",
  });
}
