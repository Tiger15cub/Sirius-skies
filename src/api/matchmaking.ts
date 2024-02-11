import { Router } from "express";
import log from "../utils/log";
import { createCipheriv, randomBytes, createDecipheriv } from "crypto";
import Accounts from "../models/Accounts";
import { getEnv } from "../utils";
import path from "node:path";
import { v4 as uuid } from "uuid";
import fs from "node:fs/promises";
import verifyToken from "../middleware/verifyToken";

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

export function decryptAES256(encryptedData: string, key: Buffer): string {
  const iv = Buffer.from(encryptedData.slice(0, 32), "hex");
  const encryptedText = encryptedData.slice(32);

  const decipher = createDecipheriv("aes-256-ctr", key, iv);

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export default function initRoute(router: Router): void {
  router.get(
    "/fortnite/api/game/v2/matchmakingservice/ticket/player/:accountId",
    verifyToken,
    async (req, res) => {
      try {
        const { accountId } = req.params;
        const bucketId = req.query.bucketId as string;

        const account = await Accounts.findOne({ accountId }).cacheQuery();
        const accessToken = req.headers.authorization
          ?.split("bearer ")[1]
          ?.replace("eg1~", "");

        if (!account) {
          return res.status(404).json({ error: "Account not found." });
        }

        const serversPath = path.join(
          __dirname,
          "..",
          "..",
          "servers",
          "Servers.json"
        );
        const servers = require(serversPath);

        if (account.banned) {
          return res.status(200).json({});
        }

        if (!bucketId || !accountId) {
          return res.status(200).json({});
        }

        const bucketIds = bucketId.split(":");
        if (bucketIds.length < 4) {
          return res.status(200).json({});
        }

        res.cookie("currentBuildUniqueId", bucketIds[0]);
        res.cookie("playlist", bucketIds[3]);
        res.cookie("region", bucketIds[2]);

        const currentBucketId = bucketIds[0];
        let playlist = bucketIds[3];
        const region = bucketIds[2];

        let isPlaylistValid: boolean = false;
        let customKey = req.query["player.option.customKey"];
        let subRegions = req.query["player.subregions"] as string[];
        let platform = req.query["player.platform"];

        const playlist_mapping: { [key: number]: string } = {
          10: "playlist_defaultduo",
          2: "playlist_defaultsolo",
          9: "playlist_defaultsquad",
        };

        if (!isNaN(parseInt(playlist))) {
          if (playlist_mapping.hasOwnProperty(parseInt(playlist))) {
            playlist = playlist_mapping[parseInt(playlist)];
          }
        }

        if (customKey !== undefined && typeof customKey === "string") {
          // TODO: Do custom key
        }

        servers.forEach((server: any) => {
          if (playlist.toLowerCase() === server.playlist.toLowerCase()) {
            isPlaylistValid = true;
          }
        });

        if (!isPlaylistValid) {
          return res.status(401).json({
            error:
              "This playlist is not currently being hosted or is not available in your region.",
          });
        }

        const encryptionKey = generateRandomKey();

        return res.status(200).json({
          serviceUrl: "ws://127.0.0.1",
          ticketType: "mms-player",
          payload: JSON.stringify({
            playerId: accountId,
            partyPlayerIds: [accountId],
            bucketId: bucketIds + ":PC:public:1",
            attributes: {
              "player.userAgent": req.headers["user-agent"],
              "player.preferredSubregion": subRegions?.toString().split(",")[0],
              "player.option.spectator": "false",
              "player.inputTypes": "",
              "player.revision": "1",
              "player.teamFormat": "fun",
            },
            expireAt: new Date(
              new Date().getTime() + 32 * 60 * 60 * 1000
            ).toISOString(),
            nonce: uuid(),
          }),
          signature: encryptAES256(
            JSON.stringify({
              accountId,
              buildId: currentBucketId,
              playlist,
              region,
              customKey: customKey ?? "NONE",
              accessToken,
              timestamp: new Date().toISOString(),
            }),
            encryptionKey
          ),
        });
      } catch (error) {
        const err: Error = error as Error;
        log.error(`An error occurred: ${err.message}`, "Matchmaking");
        return res.status(500).send("Internal Server Error");
      }
    }
  );

  router.post(
    "/fortnite/api/matchmaking/session/:sessionId/join",
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
    "/fortnite/api/matchmaking/session",
    verifyToken,
    async (req, res) => {
      const { sessionId } = req.params;

      const serversPath = path.join(
        __dirname,
        "..",
        "..",
        "servers",
        "Servers.json"
      );
      const servers = require(serversPath);

      let serverAddress: string = "";
      let serverPort: number = Number("");

      try {
        const playlist = req.cookies["playlist"];
        const region = req.cookies["region"];

        let matchingServerFound: boolean = false;

        servers.forEach((server: any) => {
          if (
            playlist.toLowerCase() === server.playlist.toLowerCase() &&
            region.toLowerCase() === server.region.toLowerCase()
          ) {
            serverAddress = server.serverAddress;
            serverPort = Number(server.serverPort);
            matchingServerFound = true;
          }
        });

        if (!matchingServerFound) {
          log.error(
            "Server not found for the given playlist and region.",
            "Matchmaking"
          );
        }
      } catch (error) {
        let err: Error = error as Error;
        log.error(`An error occured: ${err.message}`, "Matchmaking");
        return res.status(500).json({ error: "Internal Server Error" });
      }

      res.json({
        id: "sirius",
        ownerId: "sirius",
        ownerName: "sirius",
        serverName: "sirius",
        openPrivatePlayers: 0,
        openPublicPlayers: 200,
        isDedicated: true,
        maxPublicPlayers: 200,
        maxPrivatePlayers: 0,
        shouldAdvertise: false,
        allowJoinInProgress: false,
        usesStats: false,
        allowInvites: false,
        usesPresence: false,
        allowJoinViaPresence: false,
        allowJoinViaPresenceFriendsOnly: false,
        buildUniqueId: req.cookies["currentbuildUniqueId"] || "0",
        attributes: {},
      });
    }
  );

  router.get(
    "/fortnite/api/matchmaking/session/:sessionId",
    verifyToken,
    async (req, res) => {
      const { sessionId } = req.params;

      const serversPath = path.join(
        __dirname,
        "..",
        "..",
        "servers",
        "Servers.json"
      );
      const servers = require(serversPath);

      let serverAddress: string = "";
      let serverPort: number = Number("");

      try {
        const playlist = req.cookies["playlist"];
        const region = req.cookies["region"];

        let matchingServerFound: boolean = false;

        servers.forEach((server: any) => {
          if (
            playlist.toLowerCase() === server.playlist.toLowerCase() &&
            region.toLowerCase() === server.region.toLowerCase()
          ) {
            serverAddress = server.serverAddress;
            serverPort = Number(server.serverPort);
            matchingServerFound = true;
          }
        });

        if (!matchingServerFound) {
          log.error(
            "Server not found for the given playlist and region.",
            "Matchmaking"
          );
        }
      } catch (error) {
        let err: Error = error as Error;
        log.error(`An error occured: ${err.message}`, "Matchmaking");
        return res.status(500).json({ error: "Internal Server Error" });
      }

      res.status(204).json({
        id: sessionId,
        ownerId: uuid().replace(/-/gi, "").toUpperCase(),
        ownerName: "[DS]fortnite-liveeugcec1c2e30ubrcore0a-z8hj-1968",
        serverName: "[DS]fortnite-liveeugcec1c2e30ubrcore0a-z8hj-1968",
        serverAddress: serverAddress,
        serverPort: serverPort,
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
          SESSIONKEY_s: uuid().replace(/-/gi, "").toUpperCase(),
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
        buildUniqueId: req.cookies["currentbuildUniqueId"] || "0",
        lastUpdated: new Date().toISOString(),
        started: false,
      });
    }
  );
}
