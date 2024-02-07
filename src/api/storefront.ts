import { Router } from "express";
import path from "node:path";
import fs from "node:fs/promises";
import log from "../utils/log";
import { Storefront } from "../interface";
import { ProcessStorefrontItems } from "../utils/storefront/ProcessStorefrontItems";
import verifyToken from "../middleware/verifyToken";
import { getSeason } from "../utils";
import Friends from "../models/Friends";
import { getProfile } from "../common/mcp/utils/getProfile";

export async function json(filePath: string): Promise<any> {
  const fileContent = await fs.readFile(filePath, "utf8");
  return JSON.parse(fileContent);
}

export default function initRoute(router: Router) {
  router.get(
    "/fortnite/api/storefront/v2/catalog",
    verifyToken,
    async (req, res) => {
      const shop = path.join(
        __dirname,
        "..",
        "common",
        "resources",
        "storefront",
        "shop.json"
      );

      const season = getSeason(req.headers["user-agent"]);

      if (
        season?.buildUpdate === "2870186" ||
        season?.season === 0 ||
        season?.build === 0 ||
        season?.netcl === "2870186"
      ) {
        return res.status(404).end();
      }

      const BattlePasses = [
        "Season12BattlePass",
        "Season10BattlePass",
        "Season9BattlePass",
        "Season8BattlePass",
        "Season7BattlePass",
        "Season6BattlePass",
        "Season5BattlePass",
        "Season4BattlePass",
        "Season3BattlePass",
        "Season2BattlePass",
      ];

      try {
        const Data = await json(shop);

        const storefront: Storefront = {
          refreshIntervalHrs: 24,
          dailyPurchaseHrs: 24,
          expiration: Data.expiration,
          storefronts: [
            { name: "BRDailyStorefront", catalogEntries: [] },
            { name: "BRWeeklyStorefront", catalogEntries: [] },
          ],
        };

        let weeklyPriority: number = 0;
        let dailyPriority: number = 0;

        for (const battlepass of BattlePasses) {
          const filePath = path.join(
            __dirname,
            "..",
            "common",
            "resources",
            "storefront",
            "battlepasses",
            `${battlepass}.json`
          );

          const BattlePassData = await json(filePath);
          const { name, catalogEntries } = BattlePassData;

          storefront.storefronts.push({
            name,
            catalogEntries,
          });
        }

        const dailyStorefrontItems = Data.catalogItems.BRDailyStorefront || [];
        ProcessStorefrontItems(
          "BRDailyStorefront",
          dailyStorefrontItems,
          dailyPriority,
          storefront,
          res,
          req
        );

        const weeklyStorefrontItems =
          Data.catalogItems.BRWeeklyStorefront || [];
        ProcessStorefrontItems(
          "BRWeeklyStorefront",
          weeklyStorefrontItems,
          weeklyPriority,
          storefront,
          res,
          req
        );

        if (storefront) {
          res.status(200).json(storefront);
        } else {
          res.status(500).json({ error: "Internal Server Error" });
        }
      } catch (error) {
        let err: Error = error as Error;
        log.error(`Failed to get Catalog: ${err.message}`, "Storefront");
        return res.status(500).json({ error: "Internal Server Error" });
      }
    }
  );
}
