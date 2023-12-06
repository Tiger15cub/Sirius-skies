export interface Item {
  id: string;
  type: string;
  rarity: string;
  introduction?: {
    chapter?: string | null;
    season?: string | null;
  };
  imageUrl?: string;
  price?: number;
  shopHistory?: any[];
  cosmeticName?: string;
  category?: string;
}
