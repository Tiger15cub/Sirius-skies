import { MetaInfoItem } from "./MetaInfoItem";

export interface ShopItem {
  section?: string;
  id: string;
  item: string;
  name: string;
  items: string;
  price: number;
  rarity: number;
  displayAssetPath?: string;
  newDisplayAssetPath?: string;
  meta?: MetaInfoItem[];
  metaInfo?: MetaInfoItem[];
  categories?: string[];
}

export interface ShopItemField {
  name: string;
  value: string | number;
  inline?: boolean;
}

export interface SavedData {
  weekly: ShopItem[];
  weeklyFields: ShopItemField[];
  daily: ShopItem[];
  dailyFields: ShopItemField[];
}
