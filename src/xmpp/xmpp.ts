import { WebSocketServer as Server } from "ws";
import express from "express";
import { getEnv } from "../utils";
import log from "../utils/log";
import chalk from "chalk";
import HandleConnection from "./helpers/HandleConnection";
import { Saves } from "./types/Saves";
import { Globals } from "./types/XmppTypes";

const app = express();

chalk.level = 3;

const wss = new Server({
  server: app.listen(getEnv("XMPP_PORT")),
});

wss.on("listening", () => {
  log.custom(`Listening on ws://127.0.0.1:${getEnv("XMPP_PORT")}`, "XMPP");
});

wss.on("connection", async (socket, request: express.Request) => {
  HandleConnection.handleConnection(socket, request);
});

app.use("/clients", async (req, res) => {
  if (!res.locals.hasWebSocket) {
    res.json({
      connectedClients: Saves.ConnectedClients.size,
      clients: Globals.Clients.map((client) => ({
        accountId: client.accountId,
        displayName: client.displayName,
        lastPresenceUpdate: client.lastPresenceUpdate,
        resource: client.resource,
        jid: client.jid,
      })),
    });
  } else {
    res.status(400).json({ error: "BadRequest" });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not Found." });
});
