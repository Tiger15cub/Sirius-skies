import WebSocket from "ws";
import { IncomingMessage } from "http";
import { Saves } from "../types/Saves";
import xmlparser from "xml-parser";
import open from "../roots/open";
import { Globals, jid } from "../types/XmppTypes";
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
            await open(socket, Globals.isAuthenticated, id);
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

          default:
            log.error(`Unknown Root: ${document.root.name}`, "HandleMessage");
        }

        const isValidConnection =
          !Saves.activeConnection &&
          Globals.isAuthenticated &&
          Globals.accountId &&
          Globals.displayName &&
          Globals.jid &&
          Saves.resource &&
          id !== "";

        if (isValidConnection) {
          try {
            const existingClientIndex = Globals.Clients.findIndex(
              (client) => client.accountId === Globals.accountId
            );

            if (Saves.GlobalClients.has(Globals.accountId)) {
              // if (existingClientIndex !== -1) {
              //   Globals.Clients[existingClientIndex].socket = undefined;
              // }

              Saves.blacklistedAccounts.add(Globals.accountId);
              Saves.blacklistedSockets.add(socket);
            } else {
              const newClient = {
                socket,
                accountId: Globals.accountId,
                displayName: Globals.displayName,
                token: Globals.token,
                jid: Globals.jid,
                resource: Saves.resource,
                lastPresenceUpdate: {
                  away: false,
                  status: "{}",
                },
              };

              if (existingClientIndex !== -1) {
                Globals.Clients[existingClientIndex].socket = socket;
              } else {
                Globals.Clients.push(newClient);
                Saves.activeAccountIds.add(Globals.accountId);
              }

              Saves.GlobalClients.set(Globals.accountId, true);

              Saves.blacklistedAccounts.delete(Globals.accountId);
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
