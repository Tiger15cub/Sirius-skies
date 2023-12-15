import fs from "node:fs";
import path from "node:path";
import { getEnv } from "../../getEnv";
import { SavedData, ShopItem, ShopItemField } from "../types/ShopTypes";
import { DateTime, Duration } from "luxon";
import log from "../../log";
import Prices from "../prices/Prices";

export default class Shop {
  public static readonly itemTypes = ["characters", "dances", "pickaxes"];
  public static readonly itemTypesWithWrap = [
    "characters",
    "dances",
    "gliders",
    "pickaxes",
    "wraps",
  ];

  public static readonly rarityProbabilities = [0.6, 0.25, 0.15];
  public static readonly rarityProbabilitiesWithWrap = [
    0.3, 0.3, 0.3, 0.3, 0.15,
  ];

  private static isSpecialShop(): boolean {
    if (getEnv("isSpecialShop") === "true") {
      return true;
    }

    return false;
  }

  public static generateShopItem(
    savedData: SavedData,
    shopCollection: ShopItem[],
    shopFields: ShopItemField[],
    itemType: string[],
    rarityProb: number[]
  ): void {
    const random = Math.random();
    let selectedItemType = null;
    let cumulativeProbability = 0.0;

    for (let i = 0; i < rarityProb.length; i++) {
      cumulativeProbability += rarityProb[i];

      if (random < cumulativeProbability) {
        selectedItemType = itemType[i];
        break;
      }
    }

    if (selectedItemType === null) {
      shopFields.push({
        name: "ShopFields Error",
        value: "Failed to select item type.",
      });
      return;
    }

    const FilePath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "common",
      "resources",
      "storefront",
      `${selectedItemType}.json`
    );
    const Items = JSON.parse(fs.readFileSync(FilePath, "utf-8"));

    const randomIndex = Math.floor(Math.random() * Items.length);
    const randomShopItem = Items[randomIndex];

    let attempts: number = 0;
    let maxAttempts: number = 3;

    if (
      randomShopItem.lastUpdatedDate &&
      DateTime.fromISO(randomShopItem.lastUpdatedDate).hasSame(
        DateTime.local(),
        "month"
      )
    ) {
      if (attempts < maxAttempts) {
        attempts += 1;
        this.generateShopItem(
          savedData,
          shopCollection,
          shopFields,
          itemType,
          rarityProb
        );
        return;
      } else {
        shopFields.push({
          name: "ShopFields Error",
          value: "Max attempts reached for regenerating item.",
        });
        return;
      }
    }

    randomShopItem.lastUpdatedDate = DateTime.local().toISODate();

    const updatedContent = JSON.stringify(Items, null, 2);
    fs.writeFileSync(FilePath, updatedContent);

    log.log(
      `Generated item '${randomShopItem.name}' in shop`,
      "GenerateShopItem",
      "green"
    );

    let itemPrice = "0";

    try {
      const categoryPrices = Prices[selectedItemType as keyof Prices] as {
        [key: string]: number;
      };

      if (categoryPrices && categoryPrices[randomShopItem.rarity]) {
        itemPrice = categoryPrices[randomShopItem.rarity].toString();
      } else {
        throw new Error("Invalid category or rarity");
      }
    } catch (error) {
      log.error(`Error getting item price: ${error}`, "GenerateShopItem");
    }

    shopFields.push({
      name: randomShopItem.name || "Failed: Item Name Missing",
      value: `Vbucks: ${itemPrice}\nItem: ${selectedItemType}`,
    });

    shopCollection.push({
      id: Math.random().toString(36).substring(2),
      item: randomShopItem.item || "Failed: Item Type Missing",
      name: randomShopItem.name || "Failed: Item Name Missing",
      items: randomShopItem.items || "Failed: Item Details Missing",
      price: parseInt(itemPrice || "9999", 10),
      rarity: randomShopItem.rarity || "Failed: Rarity Missing",
    });
  }

  private static async generateWeekly(
    savedData: SavedData,
    amount: number
  ): Promise<void> {
    const maxIterations = Math.min(amount, 7); // Use 7 as the maximum number of iterations
    for (let i = 0; i < maxIterations; i++) {
      this.generateShopItem(
        savedData,
        savedData.weekly,
        savedData.weeklyFields,
        this.itemTypes,
        this.rarityProbabilities
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (i === 4) {
        break;
      }
    }
  }

  private static async generateDaily(
    savedData: SavedData,
    amount: number
  ): Promise<void> {
    const maxItems = 5;
    amount = Math.min(amount, maxItems);

    for (let i = 0; i < amount; i++) {
      this.generateShopItem(
        savedData,
        savedData.daily,
        savedData.dailyFields,
        this.itemTypesWithWrap,
        this.rarityProbabilitiesWithWrap
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  private static async regenerateBundle(
    savedData: SavedData,
    attempts: number,
    maxAttempts: number,
    minWeeklyItems: number,
    maxWeeklyItems: number
  ): Promise<boolean> {
    if (attempts >= maxAttempts) {
      log.error(
        "Max attempts reached for regenerating bundle.",
        "RegenerateBundle"
      );
      return false;
    }

    const bundle = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "common",
      "resources",
      "storefront",
      "bundles",
      "bundles.json"
    );

    try {
      const bundleContent = fs.readFileSync(bundle, "utf-8");
      const bundleItems = JSON.parse(bundleContent);

      const randomIndex = Math.floor(Math.random() * bundleItems.length);
      const randomBundleItem = bundleItems[randomIndex];

      if (
        randomBundleItem.lastUpdatedDate &&
        DateTime.fromISO(randomBundleItem.lastUpdatedDate).hasSame(
          DateTime.local(),
          "month"
        )
      ) {
        log.log(
          "Bundle already shown this month. Regenerating...",
          "RegenerateBundle",
          "blue"
        );

        const weeklyItems = Math.floor(Math.random() * (4 - 2 + 1)) + 2;
        const dailyItems = Math.floor(Math.random() * (6 - 4 + 1)) + 4;

        const maxDailyItems: number = 0;
        const maxWeeklyItems: number = 0;

        const effectiveDailyItems = Math.min(dailyItems, maxDailyItems);
        const effectiveWeeklyItems = Math.min(weeklyItems, maxWeeklyItems);

        await this.generateDaily(savedData, effectiveDailyItems);
        await this.generateWeekly(savedData, effectiveWeeklyItems);

        log.log("Regenerating bundle...", "RegenerateBundle", "blue");

        randomBundleItem.lastUpdatedDate = DateTime.local().toISODate();

        fs.writeFileSync(bundle, JSON.stringify(bundleItems, null, 2));

        log.log(
          "Bundle has been regenerated successfully.",
          "RegenerateBundle",
          "greenBright"
        );
        return true;
      }
      return false;
    } catch (error) {
      let err: Error = error as Error;
      log.error(
        `Error regenerating bundle: ${err.message}`,
        "RegenerateBundle"
      );
      return false;
    }
  }

  static async Initialize(savedData: SavedData): Promise<void> {
    let attempts: number = 0;
    let maxAttempts: number = 4;

    const random = Math.random();

    const minWeeklyItems = 10;
    const maxWeeklyItems = 15;

    const weekly =
      Math.floor(random * (maxWeeklyItems - minWeeklyItems + 1)) +
      minWeeklyItems;
    const daily = Math.floor(random * (7 - 5 + 1)) + 5;

    if (this.isSpecialShop()) {
      // TODO
    } else {
      if (
        await this.regenerateBundle(
          savedData,
          attempts,
          maxAttempts,
          minWeeklyItems,
          maxWeeklyItems
        )
      ) {
        log.log("Bundle generated successfully.", "Initialize", "blue");
      } else {
        await this.generateWeekly(savedData, weekly);
        await this.generateDaily(savedData, daily);
      }
    }

    try {
      const date = DateTime.utc().setZone("GMT");

      const generate = {
        expiration: date
          .set({ hour: 17, minute: 0, second: 0, millisecond: 0 })
          .plus(Duration.fromObject({ days: 1 }))
          .toISO(),
        cacheExpire: date
          .set({ hour: 16, minute: 57, second: 14, millisecond: 490 })
          .plus(Duration.fromObject({ days: 1 }))
          .toISO(),
        catalogItems: {
          BRWeeklyStorefront: savedData.weekly,
          BRDailyStorefront: savedData.daily,
        },
      };

      const FilePath = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "common",
        "resources",
        "storefront",
        "shop.json"
      );

      if (!fs.existsSync(FilePath)) {
        fs.writeFileSync(
          FilePath,
          JSON.stringify({
            expiration: "9999-12-31T23:59:59.999Z",
            cacheExpire: "9999-12-31T23:59:59.999Z",
            catalogItems: {
              BRWeeklyStorefront: [],
              BRDailyStorefront: [],
            },
          })
        );
      }

      fs.writeFileSync(FilePath, JSON.stringify(generate, null, 2));

      log.log("Successfully generated Shop", "Initialize", "blue");
    } catch (error) {
      log.error(`Error saving shop data: ${error}`, "Initialize");
    }
  }
}
