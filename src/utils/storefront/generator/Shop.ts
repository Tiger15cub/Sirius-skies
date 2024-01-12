import fs from "node:fs";
import path from "node:path";
import { getEnv } from "../../getEnv";
import { SavedData, ShopItem, ShopItemField } from "../types/ShopTypes";
import { DateTime, Duration } from "luxon";
import log from "../../log";
import Prices from "../prices/Prices";
import {
  getDisplayAsset,
  setDisplayAsset,
  setNewDisplayAssetPath,
} from "../displayAssets/getDisplayAsset";
import MetaInfoBuilder, { Section, TileSize } from "../createMetaInfo";
import { MetaInfoItem } from "../types/MetaInfoItem";

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

    const meta = new MetaInfoBuilder();

    randomShopItem.displayAssetPath = randomShopItem.displayAssetPath || "";
    randomShopItem.newDisplayAssetPath =
      randomShopItem.newDisplayAssetPath || "";

    if (randomShopItem.displayAssetPath === "") {
      randomShopItem.displayAssetPath = setDisplayAsset(
        `DA_Featured_${randomShopItem.item}`
      );

      meta.addMetaInfo("DisplayAssetPath", randomShopItem.displayAssetPath);
    }

    if (randomShopItem.newDisplayAssetPath === "") {
      randomShopItem.newDisplayAssetPath = setNewDisplayAssetPath(
        `DAv2_${randomShopItem.item}`
      );

      meta.addMetaInfo(
        "NewDisplayAssetPath",
        randomShopItem.newDisplayAssetPath
      );
    }

    const shopData = JSON.parse(
      fs.readFileSync(
        path.join(
          __dirname,
          "..",
          "..",
          "..",
          "common",
          "resources",
          "storefront",
          "shop.json"
        ),
        "utf-8"
      )
    );

    if (!randomShopItem.metaInfo) {
      const uniqueKeys = new Set<string>();
      randomShopItem.metaInfo = [];

      const numFeaturedSections = Math.floor(Math.random() * 6); // Random number between 0 and 5

      for (let i = 1; i <= numFeaturedSections; i++) {
        const isChosenSection = Math.random() < 0.5; // 50% chance for Featured

        const section = isChosenSection ? Section.Featured : Section.Daily;

        meta.setTileSize(isChosenSection ? TileSize.Normal : TileSize.Small);
        meta.setSection(section);
        meta.setDisplayAsset(randomShopItem.displayAssetPath);
        meta.setNewDisplayAsset(randomShopItem.newDisplayAssetPath);

        const newMetaInfo = meta.createMetaInfo();

        // Remove existing entries with the same key
        randomShopItem.metaInfo = randomShopItem.metaInfo.filter(
          (existingItem: MetaInfoItem) => {
            const isDuplicate = newMetaInfo.some(
              (newItem) => newItem.key === existingItem.key
            );
            if (isDuplicate) {
              uniqueKeys.delete(existingItem.key); // Remove key from uniqueKeys if it's a duplicate
            }
            return !isDuplicate;
          }
        );

        newMetaInfo.forEach((newItem) => {
          if (!uniqueKeys.has(newItem.key)) {
            if (randomShopItem.metaInfo.length < 7) {
              randomShopItem.metaInfo.push(newItem);
              uniqueKeys.add(newItem.key);
            }
          }
        });
      }

      const remainingItems = meta
        .createMetaInfo()
        .filter((newItem) => !uniqueKeys.has(newItem.key));

      shopData.catalogItems.BRWeeklyStorefront.forEach((item: ShopItem) => {
        if (item.metaInfo) {
          item.metaInfo.forEach((metaItem: MetaInfoItem) => {
            if (metaItem.key === "SectionId" && metaItem.value === "Featured") {
              const sectionIdWithFeatured = metaItem.value;

              metaItem.value = "Daily";
            }
          });
        }
      });

      shopData.catalogItems.BRDailyStorefront.forEach((item: ShopItem) => {
        if (item.metaInfo) {
          item.metaInfo.forEach((metaItem: MetaInfoItem) => {
            if (metaItem.key === "SectionId" && metaItem.value === "Daily") {
              const sectionIdWithDaily = metaItem.value;

              metaItem.value = "Featured";
            }
          });
        }
      });

      shopData.catalogItems.BRWeeklyStorefront =
        shopData.catalogItems.BRWeeklyStorefront.concat(remainingItems);
    }

    if (!randomShopItem.meta) {
      randomShopItem.meta = {
        displayAssetPath: randomShopItem.displayAssetPath,
        newDisplayAssetPath: randomShopItem.newDisplayAssetPath,
        SectionId: randomShopItem.metaInfo.find(
          (data: any) => data.key === "SectionId"
        )?.value,
        TitleSize: randomShopItem.metaInfo.find(
          (data: any) => data.key === "TileSize"
        )?.value,
      };
    }

    if (!randomShopItem.categories) {
      randomShopItem.categories = [randomShopItem.name];
    }

    randomShopItem.lastUpdatedDate = DateTime.local().toISODate();

    const updatedContent = JSON.stringify(Items, null, 2);
    fs.writeFileSync(FilePath, updatedContent);

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
      price: parseInt(itemPrice || "1000000", 10),
      rarity: randomShopItem.rarity || "Failed: Rarity Missing",
      ...(randomShopItem.displayAssetPath !== "" && {
        displayAssetPath: randomShopItem.displayAssetPath,
      }),
      ...(randomShopItem.newDisplayAssetPath !== "" && {
        newDisplayAssetPath: randomShopItem.newDisplayAssetPath,
      }),
      ...(randomShopItem.metaInfo !== "" && {
        metaInfo: randomShopItem.metaInfo,
      }),
      ...(randomShopItem.meta !== "" && {
        meta: randomShopItem.meta,
      }),
      ...(randomShopItem.categories !== "" && {
        categories: randomShopItem.categories,
      }),
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
    const maxItems = 6;
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

    const minWeeklyItems = 5;
    const maxWeeklyItems = 7;

    const minDailyItems = 5;
    const maxDailyItems = 7;

    const weekly =
      Math.floor(random * (maxWeeklyItems - minWeeklyItems + 1)) +
      minWeeklyItems;
    const daily =
      Math.floor(random * (maxDailyItems - minDailyItems + 1)) + minDailyItems;
    if (!this.isSpecialShop()) {
      const bundlePromise = this.regenerateBundle(
        savedData,
        attempts,
        maxAttempts,
        minWeeklyItems,
        maxWeeklyItems
      );

      const weeklyPromise = this.generateWeekly(savedData, weekly);
      const dailyPromise = this.generateDaily(savedData, daily);

      const [bundleResult] = await Promise.all([
        bundlePromise,
        weeklyPromise,
        dailyPromise,
      ]);

      if (bundleResult) {
        log.log("Bundle generated successfully.", "Initialize", "blue");
      } else {
        log.log(
          `Generated ${weekly} weekly items and ${daily} daily items.`,
          "Initialize",
          "green"
        );
      }
    }

    const date = DateTime.utc().setZone("GMT");

    const generate = {
      expiration: date.startOf("day").plus({ days: 1 }).toISO(),
      cacheExpire: date.startOf("day").plus({ days: 1 }).toISO(),
      catalogItems: {
        BRWeeklyStorefront: savedData.weekly,
        BRDailyStorefront: savedData.daily,
      },
    };

    const filePath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "common",
      "resources",
      "storefront",
      "shop.json"
    );

    try {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(
          filePath,
          JSON.stringify(
            {
              expiration: "9999-12-31T23:59:59.999Z",
              cacheExpire: "9999-12-31T23:59:59.999Z",
              catalogItems: {
                BRWeeklyStorefront: [],
                BRDailyStorefront: [],
              },
            },
            null,
            2
          )
        );
      }

      fs.writeFileSync(filePath, JSON.stringify(generate, null, 2));

      log.log("Successfully generated Shop", "Initialize", "blue");
    } catch (error) {
      log.error(`Error saving shop data: ${error}`, "Initialize");
    }
  }
}
