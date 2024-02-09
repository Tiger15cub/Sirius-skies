import { Router } from "express";
import Users from "../models/Users";
import jwt from "jsonwebtoken";
import { getEnv } from "../utils";
import crypto from "node:crypto";

export default function initRoute(router: Router) {
  router.get("/epic/id/v2/sdk/accounts", async (req, res) => {
    const { accountId } = req.query;

    const user = await Users.findOne({ accountId }).cacheQuery();

    if (!user) {
      return res.status(404).json({ error: "User does not exist." });
    }

    res.status(204).json({
      accountId: user.accountId,
      displayName: user.username,
      preferredLanguage: "en",
      linkedAccounts: [],
      cabinedMode: false,
      empty: false,
    });
  });

  router.get("/epic/friends/v1/:accountId/blocklist", async (req, res) => {
    const { accountId } = req.params;

    const user = await Users.findOne({ accountId }).cacheQuery();

    if (!user) {
      return res.status(404).json({ error: "User does not exist." });
    }

    res.json([]);
  });

  router.post("/auth/v1/oauth/token", async (req, res) => {
    res.json({
      access_token: jwt.sign(
        {
          tokenType: "clientToken",
          role: "GameClient",
          productId: "prod-fn",
          iss: "eos",
          env: "prod",
          features: ["AntiCheat", "Connect", "Ecom"],
          sandboxId: "fn",
          deploymentId: crypto
            .randomBytes(Math.ceil(12 / 2))
            .toString("hex")
            .slice(0, 12),
          organizationId: crypto
            .randomBytes(Math.ceil(12 / 2))
            .toString("hex")
            .slice(0, 12),
          clientId: crypto
            .randomBytes(Math.ceil(16 / 2))
            .toString("hex")
            .slice(0, 16),
          exp: Math.floor(Date.now() / 1000) + 480 * 480,
          iat: Math.floor(Date.now() / 1000),
          jti: crypto.randomBytes(32).toString("hex"),
        },
        getEnv("CLIENT_SECRET")
      ),
      token_type: "bearer",
      expires_at: "9999-12-31T23:59:59.999Z",
      features: ["AntiCheat", "Connect", "Ecom"],
      organization_id: crypto
        .randomBytes(Math.ceil(12 / 2))
        .toString("hex")
        .slice(0, 12),
      product_id: "prod-fn",
      sandbox_id: "fn",
      deployment_id: crypto
        .randomBytes(Math.ceil(12 / 2))
        .toString("hex")
        .slice(0, 12),
      expires_in: 115200,
    });
  });

  router.patch(
    "/epic/presence/v1/*/:accountId/presence/*",
    async (req, res) => {
      const { accountId } = req.params;

      const user = await Users.findOne({ accountId }).cacheQuery();

      if (!user) {
        return res.status(404).json({ error: "User does not exist." });
      }

      res.json({
        own: {
          accountId: user.accountId,
          status: "online",
          perNs: [],
        },
      });
    }
  );
}
