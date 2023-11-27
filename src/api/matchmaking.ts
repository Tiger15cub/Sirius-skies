import { Router } from "express";
import log from "../utils/log";
import { createCipheriv, randomBytes } from "crypto";
import Accounts from "../models/Accounts";
import { Servers } from "../interface";
import { getEnv } from "../utils";
import { v4 as uuid } from "uuid";

function generateRandomKey(): Buffer {
  const prefix = "matchmaking";
  const remainingBytes = 32 - prefix.length;
  const randomPart = randomBytes(remainingBytes);
  return Buffer.concat([Buffer.from(prefix), randomPart]);
}

const serversData: Servers = {
  eu: [
    {
      serverAddress: getEnv("EU_SERVER_ADDRESS"),
      serverPort: getEnv("EU_SERVER_PORT"),
      playlist: `Playlist_${getEnv("PLAYLIST")}`,
      maxPlayers: 100,
    },
  ],
  nae: [
    {
      serverAddress: getEnv("NAE_SERVER_ADDRESS"),
      serverPort: getEnv("NAE_SERVER_PORT"),
      playlist: `Playlist_${getEnv("PLAYLIST")}`,
      maxPlayers: 100,
    },
  ],
};

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

        const matchedServers = serversData.nae
          .concat(serversData.eu)
          .filter((server) => server.serverAddress.includes(sessionId));

        if (matchedServers.length > 0) {
          const server = matchedServers[0];

          log.log(
            `Matchmaking: ${server.serverAddress}:${server.serverPort}`,
            "Matchmaking",
            "cyanBright"
          );

          return res.status(200).json({
            id: sessionId,
            ownerId: uuid().replace(/-/g, "").toUpperCase(),
            ownerName: "[DS]fortnite-liveeugcec1c2e30ubrcore0a-z8hj-1968",
            serverName: "[DS]fortnite-liveeugcec1c2e30ubrcore0a-z8hj-1968",
            serverAddress: server.serverAddress,
            serverPort: Number(server.serverPort),
            maxPublicPlayers: 220,
            openPublicPlayers: 175,
            maxPrivatePlayers: 0,
            openPrivatePlayers: 0,
            attributes: {
              REGION_s: "EU",
              GAMEMODE_s: "FORTATHENA",
              ALLOWBROADCASTING_b: true,
              SUBREGION_s: "GB",
              DCID_s: "FORTNITE-LIVEEUGCEC1C2E30UBRCORE0A-14840880",
              tenant_s: "Fortnite",
              MATCHMAKINGPOOL_s: "Any",
              STORMSHIELDDEFENSETYPE_i: 0,
              HOTFIXVERSION_i: 0,
              PLAYLISTNAME_s: "Playlist_DefaultSolo",
              SESSIONKEY_s: uuid().replace(/-/g, "").toUpperCase(),
              TENANT_s: "Fortnite",
              BEACONPORT_i: 15009,
            },
            publicPlayers: [],
            privatePlayers: [],
            totalPlayers: 45,
            allowJoinInProgress: false,
            shouldAdvertise: false,
            isDedicated: false,
            usesStats: false,
            allowInvites: false,
            usesPresence: false,
            allowJoinViaPresence: true,
            allowJoinViaPresenceFriendsOnly: false,
            buildUniqueId: req.cookies["buildUniqueId"] || "0",
            lastUpdated: new Date().toISOString(),
            started: false,
          });
        }

        log.error("Failed to find server.", "Matchmaking");
      } catch (error) {
        let err: Error = error as Error;
        log.error(`An error occurred: ${err.message}`, "Matchmaking");
        return res.status(500).send();
      }
    }
  );
}
