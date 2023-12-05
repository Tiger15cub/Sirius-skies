import express from "express";
import { getEnv } from "./utils";
import { NotFound } from "./interface";
import Route from "./handlers/Route";
import Database from "./handlers/Database";
import log from "./utils/log";
import XmppServer from "./xmpp/XmppServer";
import cookieParser from "cookie-parser";
import Matchmaker from "./matchmaker/Matchmaker";

const app = express();

const PORT = getEnv("PORT") || 5555;

(async () => {
  try {
    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    await Route.initializeRoutes(app);
    await Database.connect();

    if (getEnv("isXmppEnabled") === "true") new XmppServer();
    else if (getEnv("isXmppEnabled") === "false") {
    }

    if (getEnv("isMatchmakerEnabled") === "true") new Matchmaker().start();
    else if (getEnv("isMatchmakerEnabled") === "false") {
    }

    app.use((req, res, next) => {
      let text: string = "";

      res.setHeader("Content-Type", "application/json");

      text = JSON.stringify({
        status: 404,
        errorCode: "errors.com.funkyv2.backend.route.not_found",
        errorMessage:
          "Sorry, the resource you were trying to find could not be found.",
        numericErrorCode: 1004,
        originatingService: "any",
        intent: "prod",
        url: req.url,
      } as NotFound);

      res.status(404).send(text);
    });

    if (getEnv("isDiscordBotEnabled") === "true") {
      import("./bot/deploy");
      import("./bot/bot");
    } else if (getEnv("isWebEnabled") === "true") {
    } else {
      log.warn("DiscordBot or Web is not enabled.", "Server");
    }
    app.listen(PORT, () => {
      log.log(`Listening on http://127.0.0.1:${PORT}`, "Server", "blueBright");
    });
  } catch (error) {
    let err = error as Error;
    console.error(`Error initializing routes: ${err.message}`);
    process.exit(1);
  }
})();
