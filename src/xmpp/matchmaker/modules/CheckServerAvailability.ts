import WebSocket from "ws";
import path from "path";
import log from "../../../utils/log";
import { AuthorizationPayload } from "../../../interface";
import SendMessage from "./SendMessage";
import SessionAssignmentState from "../states/SessionAssignmentState";
import JoinState from "../states/JoinState";
import Server, { IServer } from "../../../models/Servers";
import _ from "lodash";

export default async function CheckServerAvailability(
  socket: WebSocket,
  payload: AuthorizationPayload
): Promise<void> {
  try {
    if (!payload || typeof payload !== "object") {
      socket.terminate();
      throw new Error("Invalid payload");
    }
    if (
      !payload.region ||
      !["NAE", "EU"].includes(payload.region.toUpperCase())
    ) {
      socket.terminate();
      throw new Error("Invalid or missing region");
    }
    if (!payload.playlist || typeof payload.playlist !== "string") {
      socket.terminate();
      throw new Error("Invalid or missing playlist");
    }
    if (!payload.customKey || typeof payload.customKey !== "string") {
      socket.terminate();
      throw new Error("Invalid or missing custom key");
    }
    if (!payload.buildId || typeof payload.buildId !== "string") {
      socket.terminate();
      throw new Error("Invalid or missing build ID");
    }

    const availableServers: IServer[] = await Server.find({
      region: payload.region,
      playlist: payload.playlist.toLowerCase(),
      isJoinable: true,
      customKey: payload.customKey,
      buildId: payload.buildId,
      $or: [
        { playerCount: { $lt: { $ifNull: ["$maxPlayerAmount", 100] } } },
        { maxPlayerAmount: { $exists: false } },
      ],
    });

    if (_.isEmpty(availableServers) || !availableServers) {
      throw new Error(`No available servers for the region: ${payload.region}`);
    }

    const lowestPlayerCountServer = _.minBy(availableServers, "playerCount");

    if (!lowestPlayerCountServer) return socket.terminate();

    await Promise.all([
      SendMessage(socket, SessionAssignmentState(), 3000),
      SendMessage(socket, JoinState(lowestPlayerCountServer), 2000),
    ]);

    // socket.close();
  } catch (error) {
    log.error(
      `An error occurred in CheckServerAvailability: ${error}`,
      "CheckServerAvailability"
    );

    socket.terminate();
    throw error;
  }
}
