import axios from "axios";
import log from "../../log";
import {
  Canvas,
  SKRSContext2D,
  createCanvas,
  loadImage,
} from "@napi-rs/canvas";

export const drawItems = async (
  items: any[],
  startX: number,
  startY: number,
  itemsPerRow: number,
  ICON_SIZE: number,
  ctx: SKRSContext2D,
  pattern: Canvas,
  ITEM_MARGIN: number
) => {
  const totalWidth = itemsPerRow * (ICON_SIZE + ITEM_MARGIN) - ITEM_MARGIN;
  const startXCentered = startX + (ctx.canvas.width - totalWidth) / 2;

  for (let index = 0; index < items.length; index++) {
    const itemData = items[index];
    const item = itemData.item.replace(
      /^(AthenaCharacter|AthenaDance|AthenaItemWrap|AthenaGlider|AthenaPickaxe|AthenaBackpack)[:,]/,
      ""
    );

    try {
      const { data: cosmeticImage } = await axios.get(
        `https://fortnite-api.com/v2/cosmetics/br/${item}`
      );

      const image = await loadImage(cosmeticImage.data.images.icon);
      const aspectRatio = image.width / image.height;
      const imageWidth = ICON_SIZE;
      const imageHeight = ICON_SIZE / aspectRatio;

      const rowIndex = Math.floor(index / itemsPerRow);
      const columnIndex = index % itemsPerRow;

      const xOffset = startXCentered + columnIndex * (ICON_SIZE + ITEM_MARGIN);
      const yOffset = startY + rowIndex * (ICON_SIZE + ITEM_MARGIN);

      ctx.fillStyle = "#6C5B7B";
      ctx.fillRect(xOffset - 5, yOffset - 5, ICON_SIZE + 10, ICON_SIZE + 10);

      ctx.globalCompositeOperation = "overlay";
      ctx.drawImage(pattern, xOffset, yOffset, ICON_SIZE, ICON_SIZE);

      ctx.drawImage(image, xOffset, yOffset, imageWidth, imageHeight);
    } catch (error) {
      log.error(`Error loading image: ${error}`, "SendWebhook");
    }
  }
};
