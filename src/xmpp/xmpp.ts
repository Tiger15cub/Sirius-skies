import { WebSocketServer as Server } from "ws";
import express from "express";
import { getEnv } from "../utils";
import log from "../utils/log";
import chalk from "chalk";
import HandleConnection from "./helpers/HandleConnection";
import { Saves } from "./types/Saves";
import { Globals } from "./types/XmppTypes";
import { v4 as uuid } from "uuid";

const app = express();

chalk.level = 3;

const wss = new Server({
  server: app.listen(getEnv("XMPP_PORT")),
});

wss.on("listening", () => {
  log.custom(`Listening on ws://127.0.0.1:${getEnv("XMPP_PORT")}`, "XMPP");
});

wss.on("connection", async (socket, request: express.Request) => {
  HandleConnection.handleConnection(socket, Globals.UUID, request);

  socket.on("close", () => {
    Saves.clientExists = false;
    Saves.ConnectedClients.delete(Globals.UUID);

    const clientIndex = Globals.Clients.findIndex(
      (client) => client.socket === socket
    );

    const client = Globals.Clients[clientIndex];

    if (clientIndex === -1) return;

    if (clientIndex !== null || clientIndex !== -1) {
      Globals.Clients.splice(clientIndex, 1);
    }

    for (let room of Saves.JoinedMUCs) {
      // @ts-ignore
      const MUCRoom = Globals.MUCs[room];

      if (MUCRoom) {
        const MUCMemberIndex = MUCRoom.members.findIndex(
          (member: { accountId: string }) =>
            member.accountId === client.accountId
        );

        if (MUCMemberIndex !== -1) {
          return MUCRoom.members.splice(MUCMemberIndex, 1);
        }
      }
    }

    log.custom(
      `XMPP Client with the displayName ${client.displayName} has logged out.`,
      "XMPP"
    );
  });
});

app.use("/clients", async (req, res) => {
  if (!res.locals.hasWebSocket) {
    res.json({
      connectedClients: Saves.ConnectedClients.size,
      clients: Globals.Clients.map((client) => client.displayName),
    });
  } else {
    res.status(400).json({ error: "BadRequest" });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not Found." });
});
