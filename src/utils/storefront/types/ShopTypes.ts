export interface ShopItem {
  id: string;
  item: string;
  name: string;
  items: string;
  price: number;
  rarity: number;
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
