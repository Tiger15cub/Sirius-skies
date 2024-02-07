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
      (this.socket as any).isAuthenticated &&
      (this.socket as any).accountId &&
      (this.socket as any).accountId &&
      (this.socket as any).jid &&
      (this.socket as any).resource &&
      this.id !== "" &&
      !(this.socket as any).accountIds.includes(
        (this.socket as any).accountId
      ) &&
      !Saves.blacklistedAccountIds.has((this.socket as any).accountId)
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
            await open(
              this.socket,
              (this.socket as any).isAuthenticated,
              this.id
            );
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
            if (Saves.GlobalClients.has((this.socket as any).accountId)) {
              Saves.blacklistedAccounts.add((this.socket as any).accountId);
              Saves.blacklistedSockets.add(this.socket);
            } else {
              const existingClient = (global as any).Clients.find(
                (client: any) =>
                  client.accountId === (this.socket as any).accountId
              );

              if (!existingClient) {
                (global as any).Clients.push({
                  socket: this.socket,
                  accountId: (this.socket as any).accountId,
                  displayName: (this.socket as any).accountId,
                  token: (this.socket as any).token,
                  jid: (this.socket as any).jid,
                  resource: (this.socket as any).resource,
                  lastPresenceUpdate: {
                    away: false,
                    status: "{}",
                  },
                });

                Saves.activeAccountIds.add((this.socket as any).accountId);
                Saves.GlobalClients.set((this.socket as any).accountId, true);
                (this.socket as any).accountIds.push(
                  (this.socket as any).accountId
                );
              } else {
                existingClient.socket = this.socket;
                existingClient.displayName = (this.socket as any).accountId;
                existingClient.token = (this.socket as any).token;
                existingClient.jid = (this.socket as any).jid;
                existingClient.resource = (this.socket as any).resource;
                existingClient.lastPresenceUpdate = {
                  away: false,
                  status: "{}",
                };
              }

              Saves.blacklistedAccounts.delete((this.socket as any).accountId);
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
