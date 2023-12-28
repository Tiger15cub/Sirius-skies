interface PurchaseAttributes {
  favorite: boolean;
  item_seen: boolean;
  level: number;
  max_level_bonus: number;
  rnd_sel_cnt: number;
  variants: any[];
  xp: number;
}

export interface PurchaseItem {
  templateId: string;
  item?: string;
  attributes: PurchaseAttributes;
  quantity: number;
}
