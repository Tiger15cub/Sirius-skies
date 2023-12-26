import { Router } from "express";
import path from "node:path";
import fs from "node:fs";
import log from "../utils/log";
import { Storefront, StorefrontEntry } from "../interface";
import { ShopItem } from "../utils/storefront/types/ShopTypes";
import { ProcessStorefrontItems } from "../utils/storefront/ProcessStorefrontItems";
import verifyToken from "../middleware/verifyToken";

function json(filePath: string): any {
  const fileContent = fs.readFileSync(filePath, "utf8");
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

      const BattlePasses = [
        "Season10BattlePass",
        "Season9BattlePass",
        "Season8BattlePass",
        "Season7BattlePass",
        "Season6BattlePass",
        "Season5BattlePass",
      ];

      try {
        const Data = json(shop);

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

          const BattlePassData = json(filePath);
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
