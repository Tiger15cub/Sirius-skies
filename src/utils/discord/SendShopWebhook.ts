import { Canvas, createCanvas, loadImage } from "@napi-rs/canvas";
import { WebhookClient, AttachmentBuilder, EmbedBuilder } from "discord.js";
import { DateTime } from "luxon";
import { SavedData } from "../storefront/types/ShopTypes";
import { getEnv } from "../getEnv";
import createImagePattern from "./helpers/createImagePattern";
import { drawItems } from "./helpers/drawItems";

const webhook = new WebhookClient({
  id: getEnv("webhookId"),
  token: getEnv("webhookToken"),
});

const ITEM_MARGIN = 30;
const ICON_SIZE = 210;
const SECTION_MARGIN = 100;

export async function SendWebhook(savedData: SavedData): Promise<void> {
  const CANVAS_WIDTH = 1920;
  const CANVAS_HEIGHT = 1080;

  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const pattern = await createImagePattern(ICON_SIZE);

  const weeklyItemsPerRow = Math.floor(
    (CANVAS_WIDTH - ITEM_MARGIN) / (ICON_SIZE + ITEM_MARGIN)
  );
  const dailyItemsPerRow = Math.floor(
    (CANVAS_WIDTH - ITEM_MARGIN) / (ICON_SIZE + ITEM_MARGIN)
  );

  const totalWeeklyRows = Math.ceil(
    savedData.weekly.length / weeklyItemsPerRow
  );
  const totalDailyRows = Math.ceil(savedData.daily.length / dailyItemsPerRow);
  const totalRows = totalWeeklyRows + totalDailyRows;

  const totalHeightOccupiedByItems =
    totalRows * ICON_SIZE + (totalRows - 1) * ITEM_MARGIN;
  const startY = (CANVAS_HEIGHT - totalHeightOccupiedByItems) / 2;

  let currentY = startY;

  currentY += SECTION_MARGIN;
  await drawItems(
    savedData.weekly,
    (CANVAS_WIDTH - weeklyItemsPerRow * (ICON_SIZE + ITEM_MARGIN)) / 2,
    currentY,
    weeklyItemsPerRow,
    ICON_SIZE,
    ctx,
    pattern,
    ITEM_MARGIN
  );

  currentY += totalWeeklyRows * (ICON_SIZE + ITEM_MARGIN) + SECTION_MARGIN / 2;

  currentY += SECTION_MARGIN;
  await drawItems(
    savedData.daily,
    (CANVAS_WIDTH - dailyItemsPerRow * (ICON_SIZE + ITEM_MARGIN)) / 2,
    currentY,
    dailyItemsPerRow,
    ICON_SIZE,
    ctx,
    pattern,
    ITEM_MARGIN
  );

  const attachment = new AttachmentBuilder(await canvas.encode("png"), {
    name: "shop_items.png",
    description: "Shop Items",
  });

  const embed = new EmbedBuilder()
    .setTitle(
      `**New Item Shop for ${DateTime.now().toFormat("LLLL dd, yyyy")}**`
    )
    .setImage(`attachment://shop_items.png`)
    .setTimestamp();

  webhook.send({
    content: "",
    username: "Item Shop",
    embeds: [embed],
    files: [attachment],
  });
}
