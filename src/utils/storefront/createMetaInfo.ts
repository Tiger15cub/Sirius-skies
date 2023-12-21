import { MetaInfoItem } from "./types/MetaInfoItem";

let meta: MetaInfoItem[] = [];

export function addMetaInfo(key: string, value: string): MetaInfoItem[] {
  meta.push({
    key,
    value,
  });

  return meta;
}

export function setTileSize(value: string): MetaInfoItem[] {
  meta.push({
    key: "TileSize",
    value,
  });

  return meta;
}

export function setSection(value: string): MetaInfoItem[] {
  meta.push({
    key: "SectionId",
    value,
  });

  return meta;
}

export function createMetaInfo(): MetaInfoItem[] {
  return meta;
}
