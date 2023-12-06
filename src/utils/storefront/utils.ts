import axios from "axios";
import log from "../log";
import { Item, PriceConfig } from "../../interface";
import fs from "node:fs";
import path from "node:path";
import { getEnv } from "../getEnv";

export async function getCosmeticDetails(
  id: string
): Promise<{ imageUrl: string; cosmeticName: string } | null> {
  try {
    const response = await axios.get(
      `https://fortnite-api.com/v2/cosmetics/br/${id}`
    );
    const data = response.data["data"];

    if (response.status === 200) {
      return {
        imageUrl: data.images.icon,
        cosmeticName: data.name,
      };
    } else {
      log.error(
        `Failed to get item image for ID: ${id}: ${response.status} - ${data.error}`,
        "Utils"
      );
      return null;
    }
  } catch (error) {
    const err: Error = error as Error;
    log.error(
      `Error while getting item image for ID: ${id}: ${err.message}`,
      "Utils"
    );
    return null;
  }
}

export async function getImageDetails(
  item: Item
): Promise<{ id: string; imageUrl: string; cosmeticName: string } | null> {
  const cosmeticDetails = await getCosmeticDetails(item.id);
  return cosmeticDetails ? { id: item.id, ...cosmeticDetails } : null;
}

export async function getIconsForItems(items: Item[]): Promise<Item[]> {
  const iconPromises = items.map(async (item) => {
    try {
      const response = await axios.get(
        `https://fortnite-api.com/v2/cosmetics/br/${item.id}`
      );
      const imageUrl = response.data.data.images.icon;
      const cosmeticName = response.data.data.name;

      return {
        id: item.id,
        type: item.type,
        rarity: item.rarity,
        shopHistory: item.shopHistory,
        imageUrl,
        cosmeticName,
      };
    } catch (error) {
      return null;
    }
  });

  const icons = await Promise.all(iconPromises);
  return icons.filter((item): item is any => item !== null);
}

function isValidIntroduction(intro: {
  chapter: string | null;
  season: string | null;
}): boolean {
  if (!intro) {
    return false;
  }

  if (getEnv("isChapterOne") === "true") {
    if (
      intro.chapter &&
      intro.season &&
      intro.chapter === "1" &&
      intro.season.match(/^\d+$/) &&
      +intro.season <= 5
    ) {
      return true;
    }
  }

  if (getEnv("isChapterTwo") === "true") {
    if (
      intro.chapter &&
      intro.season &&
      intro.chapter === "2" &&
      intro.season.match(/^\d+$/) &&
      +intro.season <= 18
    ) {
      return true;
    }
  }

  return false;
}

export async function generateItems(): Promise<void> {
  try {
    const url: string = "https://fortnite-api.com/v2/cosmetics/br";
    const response = await axios.get(url);
    const data = response.data["data"];

    const validItems: Item[] = [];

    for (const item of data) {
      const introducedIn = item.introduction || {};

      if (isValidIntroduction(introducedIn)) {
        const validItem: Item = {
          id: item.id,
          type: item.type?.backendValue || "",
          rarity: item.rarity?.value || "",
          introduction: {
            chapter: introducedIn.chapter || null,
            season: introducedIn.season || null,
          },
          shopHistory: item.shopHistory || [],
        };

        validItems.push(validItem);
      }
    }

    if (validItems.length > 0) {
      fs.writeFileSync(
        path.join(__dirname, "shopItems.json"),
        JSON.stringify(validItems, null, 4),
        "utf-8"
      );
      log.log(
        "shopItems.json generated or updated successfully.",
        "Utils",
        "blue"
      );
    } else {
      log.log("No valid items to update.", "Utils", "blue");
    }
  } catch (error) {
    const err: Error = error as Error;
    log.error(`Error generating valid items: ${err.message}`, "Shop");
  }
}

export function processItems(
  items: Item[],
  category: string,
  limit: number,
  prices: PriceConfig
): Item[] {
  const processedItems: Item[] = [];

  items.slice(0, limit).forEach((item, index) => {
    const price = prices[item.type][item.rarity];
    const imageUrl = item.imageUrl || "";

    processedItems.push({
      id: item.id,
      type: item.type,
      rarity: item.rarity,
      shopHistory: item.shopHistory,
      price,
      imageUrl,
      category,
    });
  });

  return processedItems;
}
