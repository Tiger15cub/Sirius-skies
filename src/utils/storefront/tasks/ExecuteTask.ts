import crypto from "node:crypto";
import { calculateOneMinuteBeforeMidnight } from "../scheduler";

export async function executeTask(
  existingShop: any,
  catalogTemplate: any
): Promise<any> {
  for (const item of existingShop) {
    if (!Array.isArray(item.shopHistory) || item.shopHistory.length === 0)
      continue;

    const catalogEntry: any = {
      devName: "",
      offerId: "",
      requirements: [],
      itemGrants: [],
      sortPriority: 0,
      prices: [],
      meta: { SectionId: "Featured", TileSize: "Small" },
      metaInfo: [{ key: "SectionId", value: "Featured" }],
    };

    const storefrontIndex = catalogTemplate.storefronts.findIndex(
      (data: any) =>
        data.name ==
        (item.category === "daily" ? "BRDailyStorefront" : "BRWeeklyStorefront")
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
        requiredId: fullId,
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
        saleExpiration: calculateOneMinuteBeforeMidnight(),
        basePrice: item.price,
      },
    ];

    if (catalogEntry.itemGrants.length > 0) {
      const fullId: string = `${item.type}:${item.id}`;

      catalogEntry.devName = crypto
        .createHash("sha1")
        .update(`${JSON.stringify(fullId)}_${item.price}`)
        .digest("hex");
      catalogEntry.offerId = crypto
        .createHash("sha1")
        .update(`${JSON.stringify(fullId)}_${item.price}`)
        .digest("hex");

      catalogTemplate.storefronts[0].catalogEntries.push(catalogEntry);
    }
  }

  return catalogTemplate;
}
