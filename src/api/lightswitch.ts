import { Router } from "express";
import Accounts from "../models/Accounts";
import jwt from "jsonwebtoken";
import log from "../utils/log";

export default function initRoute(router: Router): void {
  router.get("/lightswitch/api/service/bulk/status", async (req, res) => {
    res.contentType("application/json");

    try {
      const token = req.headers.authorization?.split("bearer ")[1];

      if (!token) {
        log.error("Token not provided in headers.", "Lightswitch");
      }

      const accessToken = token?.replace("eg1~", "") as string;
      const decodedToken = jwt.decode(accessToken);

      const accountId = decodedToken?.sub;
      const account = await Accounts.findOne({ accountId });

      if (account) {
        return res.json(
          res.json([
            {
              serviceInstanceId: "fortnite",
              status: "UP",
              message: "Fortnite is UP",
              maintenanceUri: null,
              overrideCatalogIds: ["a7f138b2e51945ffbfdacc1af0541053"],
              allowedActions: [],
              banned: account.banned,
              launcherInfoDTO: {
                appName: "Fortnite",
                catalogItemId: "4fe75bbc5a674f4f9b356b5c90567da5",
                namespace: "fn",
              },
            },
          ])
        );
      }

      return res.json([
        {
          banned: false,
          status: "DOWN",
          message: "Account not found.",
        },
      ]);
    } catch (error) {
      let err = error as Error;
      log.error(`Failed to get lightswitch: ${err.message}`, "Lightswitch");
      return res.json([
        {
          banned: false,
          status: "DOWN",
          message: "An error occurred, please try again later!",
        },
      ]);
    }
  });
}
