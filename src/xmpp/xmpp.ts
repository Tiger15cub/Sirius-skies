import { WebSocketServer as Server } from "ws";
import express from "express";
import { getEnv } from "../utils";
import log from "../utils/log";
import chalk from "chalk";
import HandleConnection from "./helpers/HandleConnection";
import { Saves } from "./types/Saves";
import { Globals } from "./types/XmppTypes";
import { v4 as uuid } from "uuid";
import xmlbuilder from "xmlbuilder";
import { DateTime } from "luxon";
import HandleClose from "./helpers/HandleClose";

const app = express();

chalk.level = 3;

const wss = new Server({
  server: app.listen(getEnv("XMPP_PORT")),
});

// init
(global as any).Clients = [];
(global as any).accountId = "";
(global as any).jid = "";
(global as any).MUCs = {};

wss.on("listening", () => {
  log.custom(`Listening on ws://127.0.0.1:${getEnv("XMPP_PORT")}`, "XMPP");
});

wss.on("connection", async (socket, request: express.Request) => {
  HandleConnection.handleConnection(socket, Globals.UUID, request);

  socket.on("close", () => {
    HandleClose.handleClose(socket);
  });
});

app.use("/clients", async (req, res) => {
  if (!res.locals.hasWebSocket) {
    const clients = (global as any).Clients.map(
      (client: any) => client.displayName || ""
    );

    res.send({
      connectedClients: clients.length,
      clients: clients,
    });
  } else {
    res.status(400).json({ error: "BadRequest" });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not Found." });
});
