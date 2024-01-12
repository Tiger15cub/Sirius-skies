import { MetaInfoItem } from "./types/MetaInfoItem";

export enum TileSize {
  Small = "Small",
  Normal = "Normal",
}

export enum Section {
  Featured = "Featured",
  Daily = "Daily",
  Weekly = "Weekly",
}

export default class MetaInfoBuilder {
  private meta: MetaInfoItem[] = [];
  private dailyMeta: MetaInfoBuilder[] = [];
  private newDisplayAssetPath: string = "";
  private displayAssetPath: string = "";

  addMetaInfo(key: string, value: string): MetaInfoBuilder {
    this.meta.push({ key, value });
    return this;
  }

  setTileSize(size: TileSize): MetaInfoBuilder {
    return this.addMetaInfo("TileSize", size);
  }

  setDisplayAsset(asset: string): MetaInfoBuilder {
    this.displayAssetPath = asset;
    return this.addMetaInfo("displayAssetPath", asset);
  }

  setNewDisplayAsset(asset: string): MetaInfoBuilder {
    this.newDisplayAssetPath = asset;
    return this.addMetaInfo("newDisplayAssetPath", asset);
  }

  setSection(section: Section): MetaInfoBuilder {
    return this.addMetaInfo("SectionId", section);
  }

  setMetaInfo(info: Record<string, string>): MetaInfoBuilder {
    for (const [key, value] of Object.entries(info)) {
      this.addMetaInfo(key, value);
    }
    return this;
  }

  clearMetaInfo(): MetaInfoBuilder {
    this.dailyMeta = [];
    return this;
  }

  getMetaInfo(): MetaInfoItem[] {
    return this.meta;
  }

  createDailyInfo() {
    return [
      {
        key: "SectionId",
        value: "Daily",
      },
      {
        key: "TileSize",
        value: "Small",
      },
    ];
  }

  createMetaInfo(): MetaInfoItem[] {
    const isDaily = this.meta.some((data) => data.value === Section.Daily);

    return [
      {
        key: "newDisplayAssetPath",
        value: this.newDisplayAssetPath,
      },
      {
        key: "displayAssetPath",
        value: this.displayAssetPath,
      },
      {
        key: "SectionId",
        value: isDaily ? Section.Daily : Section.Featured,
      },
      {
        key: "TileSize",
        value: isDaily ? TileSize.Small : TileSize.Normal,
      },
    ];
  }
}
