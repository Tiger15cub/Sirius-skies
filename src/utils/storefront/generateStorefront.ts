import { Item } from "../../interface";
import Shop from "./services/Shop";
import fs from "node:fs";
import path from "node:path";
import { generateItems } from "./utils";
import log from "../log";
import cron from "node-cron";
import { executeTask } from "./tasks/ExecuteTask";

async function initializeShop(): Promise<void> {
  const shopItemsPath = path.join(__dirname, "shopItems.json");
  const shopPath = path.join(
    __dirname,
    "../../common/resources/storefront/shop.json"
  );
  const shop = new Shop();

  if (!fs.existsSync(shopItemsPath)) {
    await generateItems();
  }

  if (!fs.existsSync(shopPath)) {
    const items: Item[] = JSON.parse(fs.readFileSync(shopItemsPath, "utf-8"));

    log.error("shop.json does not exist. Generating shop...", "InitializeShop");
    await shop.generateShopConfig(items);
    return;
  }

  const existingShop = JSON.parse(fs.readFileSync(shopPath, "utf-8"));

  const catalogTemplate: any = JSON.parse(
    fs.readFileSync(
      path.join(
        __dirname,
        "../../common/resources/storefront/catalog_template.json"
      ),
      "utf-8"
    )
  );

  cron.schedule("0 0 * * *", async () => {
    const items: Item[] = JSON.parse(fs.readFileSync(shopItemsPath, "utf-8"));

    log.log("Generating now shop.", "InitializeShop", "blue");
    await generateItems();
    await shop.generateShopConfig(items);
  });

  return await executeTask(existingShop, catalogTemplate);
}

export async function getStorefront(res: any): Promise<void> {
  res.json(await initializeShop());
}
