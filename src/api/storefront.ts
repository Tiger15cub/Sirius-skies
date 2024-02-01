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

async function json(filePath: string): Promise<any> {
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
        "Season10BattlePass",
        "Season9BattlePass",
        "Season8BattlePass",
        "Season7BattlePass",
        "Season6BattlePass",
        "Season5BattlePass",
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

  router.get(
    "/fortnite/api/storefront/v2/gift/check_eligibility/recipient/:friendId/offer/:offerId",
    verifyToken,
    async (req, res) => {
      const { offerId, friendId } = req.params;
      const shop = path.join(
        __dirname,
        "..",
        "common",
        "resources",
        "storefront",
        "shop.json"
      );

      const Data = await json(shop);

      let offerItem: any = null;
      let isOfferFound: boolean = false;

      for (const section of Data.catalogEntries) {
        for (const item of Data.catalogEntries[section]) {
          if (item.id === offerId) {
            isOfferFound = true;
            break;
          }
        }

        if (isOfferFound) break;
      }

      if (!isOfferFound) {
        return res.status(400).json({
          errorCode: "errors.com.epicgames.fortnite.id_invalid",
          errorMessage: `Offer ID (${offerId}) not found.`,
          messageVars: undefined,
          numericErrorCode: 1040,
          originatingService: "any",
          intent: "prod",
          error_description: `Offer ID (${offerId}) not found.`,
          error: undefined,
        });
      }

      const friend = await Friends.findOne({
        accountId: res.locals.user.accountId,
      });

      if (!friend) return res.status(404).json({ error: "Account not Found." });

      const acceptedFriend = friend.friends.accepted.find(
        (friend) => friend.accountId === friendId
      );

      if (!acceptedFriend) {
        return res.status(400).json({
          errorCode: "errors.com.epicgames.friends.no_relationship",
          errorMessage: `User ${friend.accountId} is not friends with ${friendId}`,
          messageVars: undefined,
          numericErrorCode: 28004,
          originatingService: "any",
          intent: "prod",
          error_description: `Offer ID (${offerId}) not found.`,
          error: undefined,
        });
      }

      const userProfiles = await getProfile(friendId);

      let itemsResponse = { id: offerItem.item, items: offerItem.items };

      if (offerItem.items.length > 0) {
        const itemsArray = offerItem.items.map(
          (item: { item: string }) => item.item
        );

        itemsArray.push(itemsResponse.id);
        itemsResponse.items = itemsArray;
      } else {
        itemsResponse.items = [itemsResponse.id];
      }

      res.json({
        price: offerItem.price,
        items: itemsResponse.items,
      });
    }
  );
}
