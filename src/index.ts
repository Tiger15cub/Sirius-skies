import express from "express";
import { getEnv } from "./utils";
import Route from "./handlers/Route";
import Database from "./handlers/Database";
import log, { getMethodColor, getStatusCodeColor } from "./utils/log";
import cookieParser from "cookie-parser";
import Schedule from "./utils/storefront/ScheduleStorefront";
import path from "node:path";
import fs from "node:fs";
import winston from "winston";

const logsDirectory = path.join(process.env.LOCALAPPDATA as string, "Sirius");
if (!fs.existsSync(logsDirectory)) fs.mkdirSync(logsDirectory);

const app = express();

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDirectory, "Sirius.log"),
    }),
  ],
});

const PORT = getEnv("PORT") || 5555;
const missingUrls: Set<string> = new Set<string>();

(async () => {
  try {
    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    app.use((req, res, next) => {
      if (getEnv("ENABLE_LOGS") === "true") {
        if (
          req.originalUrl === "/images/icons/gear.png" ||
          req.originalUrl === "/favicon.ico"
        ) {
          next();
        } else {
          const startTime = process.hrtime();

          res.on("finish", () => {
            const endTime = process.hrtime(startTime);
            const durationInMs = (endTime[0] * 1e9 + endTime[1]) / 1e6;

            const methodColor = getMethodColor(req.method);
            const statusCodeColor = getStatusCodeColor(res.statusCode);

            logger.info(req.originalUrl);

            log.info(
              `(${methodColor(req.method)}) (${statusCodeColor(
                res.statusCode
              )}) (${durationInMs}ms) ${req.originalUrl}`,
              "Server"
            );
          });

          next();
        }
      } else {
        next();
      }
    });

    await Route.initializeRoutes(app);
    await Database.connect();
    import("./xmpp/xmpp");
    //import("./xmpp/matchmaker/matchmaker");

    app.use((req, res, next) => {
      res.setHeader("Content-Type", "application/json");
      const fullUrl = `${req.originalUrl.split("?")[0]}`;

      if (!missingUrls.has(fullUrl)) {
        res.status(404).json({
          status: 404,
          errorCode: "errors.com.sirius.backend.route.not_found",
          errorMessage:
            "Sorry, the resource you were trying to find could not be found.",
          numericErrorCode: 1004,
          originatingService: "any",
          intent: "prod",
        });
        logger.info(`MISSING URL ${fullUrl}`);
      }

      next();
    });

    import("./bot/deploy");
    import("./bot/bot");

    app.listen(PORT, () => {
      log.log(`Listening on http://127.0.0.1:${PORT}`, "Server", "blueBright");
    });

    await Schedule();
  } catch (error) {
    let err = error as Error;
    console.error(`Error initializing Sirius: ${err.message}`);
    process.exit(1);
  }
})();
