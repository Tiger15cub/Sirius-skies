import { Router } from "express";
import Users from "../models/Users";
import log from "../utils/log";

export default function initRoute(router: Router): void {
  router.get("/account/api/public/account/:accountId", async (req, res) => {
    const { accountId } = req.params;
    const user = await Users.findOne({ accountId }).lean();

    try {
      if (!user) {
        return res.json({});
      } else if (user.banned === true) {
        return res.json({});
      }

      return res.json({
        id: user.accountId,
        displayName: user.username,
        externalAuths: {},
      });
    } catch (error) {
      let err: Error = error as Error;
      log.error(
        `Error while fetching public account information:  ${err.message}`,
        "Account"
      );
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  router.get("/account/api/public/account", async (req, res) => {
    try {
      const accountId = req.query.accountId;

      if (!accountId) {
        return res.json({});
      }

      const accountIds = Array.isArray(accountId) ? accountId : [accountId];

      const data: any[] = [];

      for (const id of accountIds) {
        const account = await Users.findOne({ accountId: id });

        if (account) {
          data.push({
            id: account.accountId,
            links: {},
            displayName: account.username,
            cabinMode: false,
            externalAuths: {},
          });
        }
      }

      return res.json(data);
    } catch (error) {
      const err: Error = error as Error;
      log.error(
        `Error while fetching public account information: ${err.message}`,
        "Account"
      );
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  router.all("/fortnite/api/game/v2/world/info", (req, res) => {
    res.json({});
  });

  router.post(
    "/fortnite/api/game/v2/tryPlayOnPlatform/account/*",
    (req, res) => {
      res.setHeader("Content-Type", "text/plain").send(true).end();
    }
  );

  router.get("/fortnite/api/game/v2/enabled_features", (req, res) => {
    res.json([]);
  });
}
