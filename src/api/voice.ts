import { Router } from "express";
import VivoxTokenGenerator from "../utils/voicechat/vivox";
import { getEnv } from "../utils";
import PartyHandler from "../utils/party/PartyHandler";
import verifyToken from "../middleware/verifyToken";
import log from "../utils/log";
import Cache from "../middleware/Cache";

export default function initRoute(router: Router) {
  router.post(
    "/fortnite/api/game/v2/voice/:accountId/createLoginToken",
    Cache,
    verifyToken,
    async (req, res) => {
      try {
        const domain = getEnv("VIVOX_DOMAIN");
        const appName = getEnv("VIVOX_APP_NAME");
        const { accountId } = req.params;

        const tokenGenerator = new VivoxTokenGenerator(getEnv("CLIENT_SECRET"));
        const loginToken = await tokenGenerator.generateToken(
          appName,
          accountId,
          `sip:confctl-g-${appName}.p-${PartyHandler.id}@${domain}`,
          `sip:.${appName}.${accountId}.@${domain}`,
          "login"
        );

        if (!loginToken) {
          throw new Error("Failed to generate login token");
        }

        log.debug(`Created new loginToken: e30.${loginToken}`, "Voice");
        res.status(200).json({ token: `e30.${loginToken}` });
      } catch (error) {
        log.error(`Error generating login token: ${error}`, "Voice");
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );

  // idk
  router.post(
    "/fortnite/api/game/v2/voice/:accountId/createJoinToken",
    Cache,
    verifyToken,
    async (req, res) => {
      try {
        const domain = getEnv("VIVOX_DOMAIN");
        const appName = getEnv("VIVOX_APP_NAME");
        const { accountId } = req.params;

        const tokenGenerator = new VivoxTokenGenerator(getEnv("CLIENT_SECRET"));
        const joinToken = await tokenGenerator.generateToken(
          appName,
          accountId,
          `sip:confctl-g-${appName}.p-${PartyHandler.id}@${domain}`,
          `sip:.${appName}.${accountId}.@${domain}`,
          "join"
        );

        if (!joinToken) {
          throw new Error("Failed to generate join token");
        }

        log.debug(`Created new joinToken: e30.${joinToken}`, "Voice");
        res.status(200).json({ token: `e30.${joinToken}` });
      } catch (error) {
        log.error(`Error generating join token: ${error}`, "Voice");
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );
}
