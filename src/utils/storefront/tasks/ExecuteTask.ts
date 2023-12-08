import crypto from "node:crypto";
import { calculateOneMinuteBeforeMidnight } from "../scheduler";

const catalogEntry: any = {
  devName: "",
  offerId: "",
  fulfillmentIds: [],
  dailyLimit: -1,
  weeklyLimit: -1,
  monthlyLimit: -1,
  categories: [],
  prices: [
    {
      currencyType: "MtxCurrency",
      currencySubType: "",
      regularPrice: 0,
      finalPrice: 0,
      saleExpiration: "9999-12-02T01:12:00Z",
      basePrice: 0,
    },
  ],
  meta: { SectionId: "Featured", TileSize: "Small" },
  matchFilter: "",
  filterWeight: 0,
  appStoreId: [],
  requirements: [],
  offerType: "StaticPrice",
  giftInfo: {
    bIsEnabled: true,
    forcedGiftBoxTemplateId: "",
    purchaseRequirements: [],
    giftRecordIds: [],
  },
  refundable: false,
  metaInfo: [
    { key: "SectionId", value: "Featured" },
    { key: "TileSize", value: "Small" },
  ],
  displayAssetPath: "",
  itemGrants: [],
  sortPriority: 0,
  catalogGroupPriority: 0,
};

export async function executeTask(
  existingShop: any,
  catalogTemplate: any
): Promise<any> {
  for (const item of existingShop) {
    if (!Array.isArray(item.shopHistory) || item.shopHistory.length === 0)
      continue;
    catalogTemplate.expiration = calculateOneMinuteBeforeMidnight();
    const storefrontIndex = catalogTemplate.storefronts.findIndex((data: any) =>
      data.name === item.category.toLowerCase().startsWith("daily")
        ? "BRDailyStorefront"
        : "BRWeeklyStorefront"
    );
    console.log(
      item.category.toLowerCase().startsWith("daily")
        ? "BRDailyStorefront"
        : "BRWeeklyStorefront"
    );
    if (storefrontIndex === -1) continue;
    if (item.category === "daily") {
      catalogEntry.sortPriority = -1;
    } else {
      catalogEntry.meta.TileSize = "Normal";
      catalogEntry.metaInfo[0].value = "Normal";
    }
    for (const cosmetic of existingShop) {
      const fullId: string = `${cosmetic.type}:${cosmetic.id}`;
      if (typeof fullId !== "string" || fullId.length === 0) continue;
      catalogEntry.requirements.push({
        requirementType: "DenyOnItemOwnership",
        requiredId: crypto
          .createHash("sha1")
          .update(`${JSON.stringify(fullId)}`)
          .digest("hex"),
        minQuantity: 1,
      });
      catalogEntry.itemGrants.push({
        templateId: fullId,
        quantity: 1,
      });
    }
    catalogEntry.prices = [
      {
        currencyType: "MtxCurrency",
        currencySubType: "",
        regularPrice: item.price,
        finalPrice: item.price,
        saleExpiration: new Date(8000, 99, 99).toISOString(),
        basePrice: item.price,
      },
    ];
    if (catalogEntry.itemGrants.length > 0) {
      const fullId: string = `${item.type}:${item.id}`;
      catalogEntry.devName = crypto
        .createHash("sha1")
        .update(`${JSON.stringify(fullId)}_${item.price}`)
        .digest("hex");
      catalogEntry.offerId = `v2:/${crypto
        .createHash("sha1")
        .update(`${JSON.stringify(fullId)}_${item.price}`)
        .digest("hex")}`;
      catalogTemplate.storefronts[storefrontIndex].catalogEntries.push(
        catalogEntry
      );
    }
  }
  return catalogTemplate;
}
