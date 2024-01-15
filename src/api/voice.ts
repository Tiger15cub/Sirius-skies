import { Router } from "express";
import VivoxTokenGenerator from "../utils/voicechat/vivox";
import { getEnv } from "../utils";
import PartyHandler from "../utils/party/PartyHandler";
import verifyToken from "../middleware/verifyToken";

export default function initRoute(router: Router) {
  router.post(
    "/fortnite/api/game/v2/voice/:accountId/createLoginToken",
    verifyToken,
    async (req, res) => {
      const domain = getEnv("VIVOX_DOMAIN");
      const appName = getEnv("VIVOX_APP_NAME");
      const { accountId } = req.params;

      const token = new VivoxTokenGenerator(
        getEnv("CLIENT_SECRET")
      ).generateToken(
        appName,
        accountId,
        `sip:confctl-g-${appName}.p-${PartyHandler.id}@${domain}`,
        `sip:.${appName}.${accountId}.@${domain}`,
        "login"
      );

      res.status(204).json({ token: `e30.${token}` });
    }
  );
}
