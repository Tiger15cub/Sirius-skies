import fs from "node:fs";
import path from "node:path";
import { createCanvas, loadImage } from "canvas";
import { Item, PriceConfig } from "../../../interface";
import log from "../../log";
import { getIconsForItems, processItems } from "../utils";

export default class Shop {
  private featuredItems: Item[] = [];
  private dailyItems: Item[] = [];

  private prices: PriceConfig = {
    AthenaCharacter: {
      uncommon: 800,
      rare: 1200,
      epic: 1500,
      legendary: 2000,
    },
    AthenaPickaxe: {
      uncommon: 500,
      rare: 800,
      epic: 1200,
    },
    AthenaDance: {
      uncommon: 200,
      rare: 500,
      epic: 800,
    },
    AthenaLoadingScreen: {
      uncommon: 100,
    },
    AthenaGlider: {
      uncommon: 500,
      rare: 800,
      epic: 1200,
      legendary: 1500,
    },
    AthenaSkyDiveContrail: {
      rare: 100,
    },
    AthenaBackpack: {
      rare: 100,
      epic: 300,
      legendary: 800,
    },
  };

  public async generateShopConfig(eligibleItems: Item[]): Promise<void> {
    try {
      if (eligibleItems.length < 8) {
        log.error("Not enough eligibleItems to fill shop.", "Shop");
        return;
      }

      const [eligibleSkins, dailyItems] = await Promise.all([
        getIconsForItems(
          eligibleItems.filter((item) => item.type === "AthenaCharacter")
        ),
        getIconsForItems(
          eligibleItems.filter((item) => item.type !== "AthenaCharacter")
        ),
      ]);

      if (eligibleSkins.length < 2) {
        log.error("Not enough eligibleSkins to fill featured items.", "Shop");
        return;
      }

      this.featuredItems = processItems(
        eligibleSkins,
        "featured",
        2,
        this.prices
      );
      this.dailyItems = processItems(dailyItems, "daily", 6, this.prices);

      if (this.dailyItems.length < 6) {
        log.error("Not enough eligibleItems to fill the daily items.", "Shop");
        return;
      }

      const itemImages = [...this.featuredItems, ...this.dailyItems];

      fs.writeFileSync(
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
        JSON.stringify(itemImages, null, 2),
        "utf-8"
      );
      log.log("Shop has been generated.", "Shop", "blue");
    } catch (error) {
      const err: Error = error as Error;
      log.error(`Error generating shop config: ${err.message}`, "Shop");
    }
  }
}
