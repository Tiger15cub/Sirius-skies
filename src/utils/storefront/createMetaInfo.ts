import { MetaInfoItem } from "./types/MetaInfoItem";

export default class MetaInfoBuilder {
  private meta: MetaInfoItem[] = [];

  addMetaInfo(key: string, value: string): MetaInfoBuilder {
    this.meta.push({ key, value });
    return this;
  }

  setTileSize(size: "Small" | "Normal"): MetaInfoBuilder {
    return this.addMetaInfo("TileSize", size);
  }

  setSection(section: "Featured" | "Daily"): MetaInfoBuilder {
    return this.addMetaInfo("SectionId", section);
  }

  createMetaInfo(): MetaInfoItem[] {
    return this.meta;
  }
}
