import { Router } from "express";
import path from "node:path";
import fs from "node:fs";
import log from "../utils/log";
import { Storefront, StorefrontEntry } from "../interface";
import { ShopItem } from "../utils/storefront/types/ShopTypes";

function json(filePath: string): any {
  const fileContent = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileContent);
}

export default function initRoute(router: Router) {
  router.get("/fortnite/api/storefront/v2/catalog", async (req, res) => {
    const shop = path.join(
      __dirname,
      "..",
      "common",
      "resources",
      "storefront",
      "shop.json"
    );

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

      Object.keys(Data.catalogItems).forEach((storefrontName) => {
        const shopItemType = Data.catalogItems[storefrontName];

        shopItemType.forEach((item: ShopItem) => {
          const entryPriority = item.name
            .toLowerCase()
            .includes("brweeklystorefront")
            ? ++weeklyPriority
            : ++dailyPriority;

          const requirements: {
            requirementType: string;
            requiredId: string;
            minQuantity: number;
          }[] = [];
          const itemGrants: {
            templateId: string;
            quantity: number;
          }[] = [];

          try {
            if (typeof item === "object" && item !== null) {
              if (!item.item || item.item === "") {
                if (
                  item.name.toLowerCase().includes("bundle") &&
                  Array.isArray(item.items)
                ) {
                  for (const i of item.items) {
                    itemGrants.push({ templateId: i.item, quantity: 1 });
                    requirements.push({
                      requirementType: "DenyOnItemOwnership",
                      requiredId: i.item,
                      minQuantity: 1,
                    });
                  }
                } else {
                  log.warn(
                    `Skipping item with name "${item.name}" as it does not have an associated item.`,
                    "Storefront"
                  );
                }
              } else {
                itemGrants.push({ templateId: item.item, quantity: 1 });
                requirements.push({
                  requirementType: "DenyOnItemOwnership",
                  requiredId: item.item,
                  minQuantity: 1,
                });

                if (typeof item === "object" && item !== null) {
                  if (Array.isArray(item.items)) {
                    for (const i of item.items) {
                      if (typeof i === "object" && i !== null && i.item) {
                        itemGrants.push({ templateId: i.item, quantity: 1 });
                        requirements.push({
                          requirementType: "DenyOnItemOwnership",
                          requiredId: i.item,
                          minQuantity: 1,
                        });
                      }
                    }
                  }
                }

                const storefrontEntry: StorefrontEntry = {
                  devName: item.item,
                  offerId: `v2:/${item.id}`,
                  fulfillmentIds: [],
                  dailyLimit: -1,
                  weeklyLimit: -1,
                  monthlyLimit: -1,
                  categories: item.categories || [],
                  prices: [
                    {
                      currencyType: "MtxCurrency",
                      currencySubType: "",
                      regularPrice: parseInt(item.price.toString()) || 999999,
                      finalPrice: parseInt(item.price.toString()) || 999999,
                      saleExpiration: new Date(0).toISOString(),
                      basePrice: parseInt(item.price.toString()) || 999999,
                    },
                  ],
                  matchFilter: "",
                  filterWeight: 0,
                  appStoreId: [],
                  requirements,
                  offerType: "StaticPrice",
                  giftInfo: {
                    bIsEnabled: true,
                    forcedGiftBoxTemplateId: "",
                    purchaseRequirements: [],
                    giftRecordIds: [],
                  },
                  refundable: true,
                  metaInfo: [],
                  displayAssetPath: `/Game/Catalog/DisplayAssets/DA_Featured_${item.name}.DA_Featured_${item.name}`,
                  itemGrants,
                  sortPriority: entryPriority,
                  catalogGroupPriority: entryPriority,
                };

                const targetStorefrontIndex = item.name
                  .toLowerCase()
                  .includes("brweeklystorefront")
                  ? 1
                  : 0;
                storefront.storefronts[
                  targetStorefrontIndex
                ].catalogEntries.push(storefrontEntry);
              }
            }
          } catch (error) {
            let err: Error = error as Error;
            log.error(`Failed to get Catalog: ${err.message}`, "Storefront");
            return res.status(500).json({ error: "Internal Server Error" });
          }
        });
      });
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
  });
}
