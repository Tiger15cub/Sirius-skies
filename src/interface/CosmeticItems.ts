export interface CosmeticItems {
  [key: string]: {
    templateId: string;
    attributes: Record<string, any>;
    quantity?: number;
  };
}
