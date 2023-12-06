import WebSocket, { Server } from "ws";
import express, { Express } from "express";
import { getEnv } from "../utils";
import Connecting from "./root/Connecting";
import { v4 as uuid } from "uuid";
import log from "../utils/log";
import Waiting from "./root/Waiting";
import Queued from "./root/Queued";
import SessionAssignment from "./root/SessionAssignment";
import Join from "./root/Join";
import { Globals } from "../xmpp/helpers/XmppTypes";

function generateUuidAsync(): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const newUuid = uuid();
      resolve(newUuid);
    } catch (error) {
      reject(error);
    }
  });
}

export default class Matchmaker {
  private clients: number = 0;
  private socket: Server;
  private uuidPromises: [Promise<string>, Promise<string>, Promise<string>];

  private ticketId: string;
  private matchId: string;
  private sessionId: string;

  private express: express.Application;

  constructor() {
    this.ticketId = "";
    this.matchId = "";
    this.sessionId = "";

    this.express = express();

    const server = this.express.listen(getEnv("MATCHMAKER_PORT"));
    this.socket = new Server({ noServer: true });

    this.uuidPromises = [
      generateUuidAsync(),
      generateUuidAsync(),
      generateUuidAsync(),
    ];

    server.on("upgrade", (request, socket, head) => {
      this.socket.handleUpgrade(request, socket, head, (ws) => {
        this.socket.emit("connection", ws, request);
      });
    });
  }

  start() {
    Promise.all(this.uuidPromises)
      .then(([ticketId, matchId, sessionId]) => {
        this.ticketId = ticketId;
        this.matchId = matchId;
        this.sessionId = sessionId;

        this.setup();
        log.log(
          `Matchmaker listening on ws://127.0.0.1:${getEnv("MATCHMAKER_PORT")}`,
          "Matchmaker",
          "blueBright"
        );

        this.express.get("/clients", (req, res) => {
          res.json({
            clients: this.clients,
          });
        });
      })
      .catch((error) =>
        log.error(`Error initializing server: ${error}`, "Matchmaker")
      );
  }

  private setup() {
    this.socket.on("connection", (socket) => {
      this.handleConnection(socket).catch((error) =>
        log.error(`Error handling connection: ${error}`, "Matchmaker")
      );
    });
  }

  private async handleConnection(socket: WebSocket) {
    setTimeout(async () => {
      await Connecting(socket);
    }, 200);
    setTimeout(async () => {
      await Waiting(socket, this.clients);
    }, 1000);
    setTimeout(async () => {
      await Queued(socket, this.ticketId, this.clients);
    }, 2000);

    this.clients++;

    setTimeout(async () => {
      await SessionAssignment(socket, this.matchId);
    }, 6000);
    setTimeout(async () => {
      await Join(socket, this.matchId, this.sessionId);
    }, 8000);
  }
}
