import { createCanvas } from "@napi-rs/canvas";

export default async function createImagePattern(ICON_SIZE: number) {
  const patternCanvas = createCanvas(ICON_SIZE, ICON_SIZE);
  const patternCtx = patternCanvas.getContext("2d");

  const patternSize = 20;
  patternCtx.fillStyle = "rgba(255, 255, 255, 0.05)";
  for (let x = 0; x < ICON_SIZE; x += patternSize) {
    for (let y = 0; y < ICON_SIZE; y += patternSize) {
      patternCtx.fillRect(x, y, patternSize, patternSize);
    }
  }

  return patternCanvas;
}
