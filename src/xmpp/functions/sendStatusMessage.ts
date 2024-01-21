import WebSocket from "ws";
import xmlparser from "xml-parser";
import Friends from "../../models/Friends";
import { Globals } from "../types/XmppTypes";
import sendPresenceUpdate from "./sendPresenceUpdate";
import log from "../../utils/log";
import { findInIterable } from "./findInIterable";

interface StatusMessage {
  name: string;
  content?: string;
}

export default async function sendStatusMessage(
  socket: WebSocket,
  accountId: string,
  children: xmlparser.Node[]
): Promise<void> {
  const status: StatusMessage | undefined = children.find(
    (child) => child.name === "status"
  );

  if (!status?.content) {
    return;
  }

  try {
    const user = await Friends.findOne({ accountId }).lean();

    if (!user) {
      await socket.close();
      return;
    }

    const acceptedFriends = user.friends.accepted;

    for (const friend of acceptedFriends) {
      const client = findInIterable(
        Globals.Clients,
        (client) => client.accountId === friend.accountId
      );

      if (client) {
        const { jid, lastPresenceUpdate } = client;
        const isAway = lastPresenceUpdate?.away || false;

        const statusContent = lastPresenceUpdate?.status;

        try {
          const parsedStatusContent = statusContent
            ? JSON.parse(statusContent)
            : null;
          sendPresenceUpdate(
            socket,
            Globals.jid,
            jid as string,
            parsedStatusContent,
            isAway
          );
        } catch (error) {
          log.error(
            `Error parsing status content: ${error}`,
            "sendStatusMessage"
          );
        }
      }
    }
  } catch (error) {
    log.error(`Error querying user data: ${error}`, "sendStatusMessage");
  }
}
