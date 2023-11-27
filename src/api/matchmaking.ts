import { Router } from "express";
import log from "../utils/log";
import { createCipheriv, randomBytes } from "crypto";
import Accounts from "../models/Accounts";

function generateRandomKey(): Buffer {
  const prefix = "matchmaking";
  const remainingBytes = 32 - prefix.length;
  const randomPart = randomBytes(remainingBytes);
  return Buffer.concat([Buffer.from(prefix), randomPart]);
}

function encryptAES256(data: string, key: Buffer): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-ctr", key, iv);

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + encrypted;
}

export default function initRoute(router: Router): void {
  router.get(
    "/fortnite/api/game/v2/matchmakingservice/ticket/player/:accountId",
    async (req, res) => {
      try {
        const { accountId } = req.params;
        const bucketId = req.query.bucketId as string;

        const account = await Accounts.findOne({ accountId }).lean();
        const accessToken = req.headers.authorization
          ?.split("bearer ")[1]
          ?.replace("eg1~", "");

        if (!account) {
          return res.status(404).json({ error: "Account not found." });
        }

        console.debug(account.banned);

        if (account.banned) {
          return res.status(200).json({});
        }

        if (!bucketId || !accountId) {
          return res.status(200).json({});
        }

        const bucketIds = bucketId.split(":");
        console.debug(bucketIds);
        if (bucketIds.length < 4) {
          return res.status(200).json({});
        }

        res.cookie("currentbuildUniqueId", bucketIds[0]);

        const currentBucketId = bucketIds[0];
        const playlist = bucketIds[3];
        const region = bucketIds[2];

        log.log(
          `Current BucketId: ${currentBucketId}:${region}:${playlist}`,
          "Matchmaking",
          "cyanBright"
        );

        const key = generateRandomKey();

        return res.status(200).json({
          serviceUrl: "ws://127.0.0.1:8090",
          ticketType: "mms-player",
          payload: "account",
          signature: encryptAES256(
            JSON.stringify({
              accountId,
              buildId: currentBucketId,
              playlist,
              region,
              accessToken,
              timestamp: new Date().toISOString(),
            }),
            key
          ),
        });
      } catch (error) {
        let err: Error = error as Error;
        log.error(`An error occurred: ${err.message}`, "Matchmaking");
        return res.status(500).send("Internal Server Error");
      }
    }
  );

  router.post(
    "/fortnite/api/matchmaking/session/:wildcard/join",
    (req, res) => {
      res.status(204).send();
    }
  );

  router.post(
    "/fortnite/api/matchmaking/session/matchMakingRequest",
    (req, res) => {
      const response: string[] = [];
      res.status(200).json(response);
    }
  );

  router.get(
    "/fortnite/api/game/v2/matchmaking/account/:accountId/session/:sessionId",
    (req, res) => {
      const { accountId, sessionId } = req.params;

      const response = {
        accountId,
        sessionId,
        key: "none",
      };

      res.status(200).json(response);
    }
  );

  router.get(
    "/fortnite/api/matchmaking/session/findPlayer/:wildcard",
    (req, res) => {
      res.status(200).send();
    }
  );

  router.get(
    "/fortnite/api/matchmaking/session/:sessionId",
    async (req, res) => {
      try {
        const { sessionId } = req.params;

        // TODO
      } catch (error) {
        let err: Error = error as Error;
        log.error(`An error occurred: ${err.message}`, "Matchmaking");
        return res.status(500).send();
      }
    }
  );
}
