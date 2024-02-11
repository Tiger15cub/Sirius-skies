import { WebSocketServer as Server } from "ws";
import express from "express";
import log from "../../utils/log";
import chalk from "chalk";
import { getEnv } from "../../utils";
import HandleConnection from "./helpers/HandleConnection";

const app = express();
chalk.level = 3;

const wss = new Server({
  server: app.listen(getEnv("MATCHMAKER_PORT")),
});

// init
(global as any).MMClients = [];
(global as any).MMUser = [];

wss.on("listening", () => {
  log.custom(
    `Listening on ws://127.0.0.1:${getEnv("MATCHMAKER_PORT")}`,
    "Matchmaker"
  );
});

wss.on("connection", async (socket, request: express.Request) => {
  console.log(JSON.stringify(request.headers));

  await HandleConnection.handleConnection(socket, request, request.headers);
});

app.use("/clients", async (req, res) => {
  if (!res.locals.hasWebSocket) {
    res.send({
      connectedClients: (global as any).MMClients,
      clients: (global as any).MMUser.map(
        (client: { accountId: string }) => client.accountId
      ),
    });
  } else {
    res.status(400).json({ error: "BadRequest" });
  }
});
