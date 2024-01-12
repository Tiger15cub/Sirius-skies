import { Storefront, StorefrontEntry } from "../../interface";
import { getSeason } from "../getSeason";
import log from "../log";
import { ShopItem } from "./types/ShopTypes";

export const ProcessStorefrontItems = (
  storefrontName: string,
  items: ShopItem[],
  priorityCounter: number,
  storefront: Storefront,
  res: any,
  req: any
) => {
  items.forEach((item: ShopItem) => {
    const entryPriority = ++priorityCounter;

    const requirements: {
      requirementType: string;
      requiredId: string;
      minQuantity: number;
    }[] = [];

    const itemGrants: { templateId: string; quantity: number }[] = [];

    const season = getSeason(req.headers["user-agent"]);

    if (!season) return { errorMessage: "Failed to get season." };

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
      }

      let storefrontEntry: StorefrontEntry;

      if (season.season < 14) {
        storefrontEntry = {
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
              currencySubType: "Currency",
              dynamicRegularPrice: parseInt(item.price.toString()) || 0,
              regularPrice: parseInt(item.price.toString()) || 0,
              finalPrice: parseInt(item.price.toString()) || 0,
              saleExpiration: new Date(0).toISOString(),
              basePrice: parseInt(item.price.toString()) || 0,
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
          metaInfo: item.metaInfo,
          meta: item.meta,
          displayAssetPath: item.displayAssetPath,
          newDisplayAssetPath: item.newDisplayAssetPath,
          itemGrants,
          title: "",
          sortPriority: entryPriority,
          catalogGroupPriority: entryPriority,
          shortDescription: "",
        };
      } else {
        storefrontEntry = {
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
              currencySubType: "Currency",
              dynamicRegularPrice: parseInt(item.price.toString()) || 0,
              regularPrice: parseInt(item.price.toString()) || 0,
              finalPrice: parseInt(item.price.toString()) || 0,
              saleExpiration: new Date(0).toISOString(),
              basePrice: parseInt(item.price.toString()) || 0,
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
          metaInfo: item.metaInfo,
          meta: item.meta,
          displayAssetPath: item.displayAssetPath,
          newDisplayAssetPath: item.newDisplayAssetPath,
          itemGrants,
          title: "",
          sortPriority: entryPriority,
          catalogGroupPriority: entryPriority,
          shortDescription: "",
        };
      }

      storefront.storefronts[
        storefrontName.toLowerCase().includes("brweeklystorefront") ? 1 : 0
      ].catalogEntries.push(storefrontEntry);
    } catch (error) {
      let err: Error = error as Error;
      log.error(`Failed to get Catalog: ${err.message}`, "Storefront");
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
};
