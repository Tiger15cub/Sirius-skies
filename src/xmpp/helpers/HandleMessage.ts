import WebSocket from "ws";
import { IncomingMessage } from "http";
import { Saves } from "../types/Saves";
import xmlparser from "xml-parser";
import open from "../roots/open";
import { Globals } from "../types/XmppTypes";
import auth from "../roots/auth";
import log from "../../utils/log";
import iq from "../roots/iq";
import presence from "../roots/presence";
import message from "../roots/message";

export default {
  handleMessage(socket: WebSocket, request: IncomingMessage, id: string): void {
    let document: xmlparser.Document;

    socket.on("message", async (chunk: WebSocket.Data | string) => {
      try {
        if (Buffer.isBuffer(chunk)) chunk = chunk.toString();

        Saves.Received += chunk;
        document = xmlparser(Saves.Received);

        if (!document) {
          log.error("An error has occurred.", "XMPP");
          return;
        }

        switch (document.root.name) {
          case "open":
            await open(socket, (socket as any).isAuthenticated, id);
            break;
          case "auth":
            await auth(socket, document.root, id);
            break;
          case "iq":
            await iq(socket, document.root, id);
            break;
          case "message":
            await message(socket, document.root, id);
            break;
          case "presence":
            await presence(socket, document.root, id);
            break;

          case "close":
            break;

          default:
            log.error(`Unknown Root: ${document.root.name}`, "HandleMessage");
        }

        const isValidConnection =
          !Saves.activeConnection &&
          (socket as any).isAuthenticated &&
          (socket as any).accountId &&
          (socket as any).accountId &&
          (socket as any).jid &&
          (socket as any).resource &&
          id !== "";

        if (isValidConnection) {
          try {
            const existingClientIndex = (global as any).Clients.findIndex(
              (client: any) => client.accountId === (socket as any).accountId
            );

            if (Saves.GlobalClients.has((socket as any).accountId)) {
              // if (existingClientIndex !== -1) {
              //   (global as any).Clients[existingClientIndex].socket = undefined;
              // }

              Saves.blacklistedAccounts.add((socket as any).accountId);
              Saves.blacklistedSockets.add(socket);
            } else {
              const newClient = {
                socket,
                accountId: (socket as any).accountId,
                displayName: (socket as any).accountId,
                token: (socket as any).token,
                jid: (socket as any).jid,
                resource: (socket as any).resource,
                lastPresenceUpdate: {
                  away: false,
                  status: "{}",
                },
              };

              if (existingClientIndex !== -1) {
                (global as any).Clients[existingClientIndex].socket = socket;
              } else {
                (global as any).Clients.push(newClient);
                Saves.activeAccountIds.add((socket as any).accountId);
              }

              Saves.GlobalClients.set((socket as any).accountId, true);

              Saves.blacklistedAccounts.delete((socket as any).accountId);
              Saves.blacklistedSockets.delete(socket);
            }
          } catch (error) {
            log.error(`Failed to HandleMessage: ${error}`, "HandleMessage");
          }
        }

        Saves.Received = "";
      } catch (error) {
        log.error(`Error handling message: ${error}`, "XMPP");
      }
    });
  },
};
