import { Router } from "express";
import Accounts from "../models/Accounts";
import jwt from "jsonwebtoken";
import log from "../utils/log";
import verifyToken from "../middleware/verifyToken";
import Users from "../models/Users";

export default function initRoute(router: Router): void {
  router.get(
    "/lightswitch/api/service/bulk/status",
    verifyToken,
    async (req, res) => {
      res.contentType("application/json");

      try {
        const token = res.locals.decodedToken;

        if (!token) {
          log.error("Token not provided in headers.", "Lightswitch");
          return;
        }

        const account = await Accounts.findOne({
          accountId: res.locals.user.accountId,
        });
        const user = await Users.findOne({
          accountId: res.locals.user.accountId,
        });

        if (account && user) {
          return res.json([
            {
              serviceInstanceId: "fortnite",
              status: "UP",
              message: "Fortnite is UP",
              maintenanceUri: null,
              overrideCatalogIds: ["a7f138b2e51945ffbfdacc1af0541053"],
              allowedActions: ["PLAY", "DOWNLOAD"],
              banned: account.banned,
              launcherInfoDTO: {
                appName: "Fortnite",
                catalogItemId: "4fe75bbc5a674f4f9b356b5c90567da5",
                namespace: "fn",
              },
            },
          ]);
        }

        return res.json([
          {
            banned: res.locals.user.banned && res.locals.account.banned,
            status: "DOWN",
            message: "Account not found.",
          },
        ]);
      } catch (error) {
        let err = error as Error;
        log.error(`Failed to get lightswitch: ${err.message}`, "Lightswitch");
        return res.json([
          {
            banned: res.locals.user.banned && res.locals.account.banned,
            status: "DOWN",
            message: "An error occurred, please try again later!",
          },
        ]);
      }
    }
  );

  router.get(
    "/lightswitch/api/service/Fortnite/status",
    verifyToken,
    async (req, res, next) => {
      const token = res.locals.decodedToken;

      if (!token) {
        log.error("Token not provided in headers.", "Lightswitch");
        return;
      }

      const account = await Accounts.findOne({
        accountId: res.locals.user.accountId,
      });
      const user = await Users.findOne({
        accountId: res.locals.user.accountId,
      });

      if (account && user) {
        return res.json({
          serviceInstanceId: "fortnite",
          status: "UP",
          message: "Fortnite is UP",
          maintenanceUri: null,
          overrideCatalogIds: ["a7f138b2e51945ffbfdacc1af0541053"],
          allowedActions: ["PLAY", "DOWNLOAD"],
          banned: account.banned,
          launcherInfoDTO: {
            appName: "Fortnite",
            catalogItemId: "4fe75bbc5a674f4f9b356b5c90567da5",
            namespace: "fn",
          },
        });
      }

      return res.json([
        {
          banned: res.locals.user.banned && res.locals.account.banned,
          status: "DOWN",
          message: "Account not found.",
        },
      ]);
    }
  );
}
