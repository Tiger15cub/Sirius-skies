import WebSocket, { Data } from "ws";
import { IncomingMessage } from "http";
import { Saves } from "../types/Saves";
import { Globals } from "../types/XmppTypes";
import log from "../../utils/log";
import xmlparser from "xml-parser";

import auth from "../roots/auth";
import iq from "../roots/iq";
import presence from "../roots/presence";
import message from "../roots/message";
import open from "../roots/open";

export default class Connection {
  socket: WebSocket;
  request: IncomingMessage;
  id: string;

  constructor(socket: WebSocket, request: IncomingMessage, id: string) {
    this.socket = socket;
    this.request = request;
    this.id = id;
  }

  isValid(): string | boolean {
    return (
      !Saves.activeConnection &&
      Globals.isAuthenticated &&
      Globals.accountId &&
      Globals.displayName &&
      Globals.jid &&
      Saves.resource &&
      this.id !== "" &&
      !Globals.accountIds.includes(Globals.accountId) &&
      !Saves.blacklistedAccountIds.has(Globals.accountId)
    );
  }

  handleMessage(): void {
    this.socket.on("message", async (chunk: Data) => {
      try {
        if (Buffer.isBuffer(chunk)) chunk = chunk.toString();

        Saves.Received += chunk;

        const document = xmlparser(Saves.Received);

        if (!document) {
          log.error("An error has occurred.", "XMPP");
          return;
        }

        switch (document.root.name) {
          case "open":
            await open(this.socket, Globals.isAuthenticated, this.id);
            break;
          case "auth":
            await auth(this.socket, document.root, this.id);
            break;
          case "iq":
            await iq(this.socket, document.root, this.id);
            break;
          case "message":
            await message(this.socket, document.root, this.id);
            break;
          case "presence":
            await presence(this.socket, document.root, this.id);
            break;
          default:
            log.error(`Unknown Root: ${document.root.name}`, "HandleMessage");
        }

        if (this.isValid()) {
          try {
            if (Saves.GlobalClients.has(Globals.accountId)) {
              Saves.blacklistedAccounts.add(Globals.accountId);
              Saves.blacklistedSockets.add(this.socket);
            } else {
              const existingClient = Globals.Clients.find(
                (client) => client.accountId === Globals.accountId
              );

              if (!existingClient) {
                Globals.Clients.push({
                  socket: this.socket,
                  accountId: Globals.accountId,
                  displayName: Globals.displayName,
                  token: Globals.token,
                  jid: Globals.jid,
                  resource: Saves.resource,
                  lastPresenceUpdate: {
                    away: false,
                    status: "{}",
                  },
                });

                Saves.activeAccountIds.add(Globals.accountId);
                Saves.GlobalClients.set(Globals.accountId, true);
                Globals.accountIds.push(Globals.accountId);
              } else {
                existingClient.socket = this.socket;
                existingClient.displayName = Globals.displayName;
                existingClient.token = Globals.token;
                existingClient.jid = Globals.jid;
                existingClient.resource = Saves.resource;
                existingClient.lastPresenceUpdate = {
                  away: false,
                  status: "{}",
                };
              }

              Saves.blacklistedAccounts.delete(Globals.accountId);
              Saves.blacklistedSockets.delete(this.socket);
            }
          } catch (error) {
            log.error(`Failed to HandleMessage: ${error}`, "HandleMessage");
          }
        }
      } catch (error) {
        log.error(`Error handling message: ${error}`, "XMPP");
      }
    });
  }
}
