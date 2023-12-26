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

  addMetaInfo(key: string, value: string): MetaInfoBuilder {
    this.meta.push({ key, value });
    return this;
  }

  setTileSize(size: TileSize): MetaInfoBuilder {
    return this.addMetaInfo("TileSize", size);
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
