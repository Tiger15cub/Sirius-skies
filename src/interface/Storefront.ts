export interface StorefrontEntry {
  devName: string;
  offerId: string;
  fulfillmentIds: string[];
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
  categories: string[];
  prices: {
    currencyType: string;
    currencySubType: string;
    regularPrice: number;
    dynamicRegularPrice: number;
    finalPrice: number;
    saleExpiration: string;
    basePrice: number;
  }[];
  matchFilter: string;
  filterWeight: number;
  appStoreId: string[];
  requirements: {
    requirementType: string;
    requiredId: string;
    minQuantity: number;
  }[];
  offerType: string;
  giftInfo: {
    bIsEnabled: boolean;
    forcedGiftBoxTemplateId: string;
    purchaseRequirements: any[];
    giftRecordIds: any[];
  };
  refundable: boolean;
  metaInfo: any[] | undefined;
  meta: any[] | undefined;
  displayAssetPath: string | undefined;
  newDisplayAssetPath: string | undefined;
  itemGrants: { templateId: string; quantity: number }[];
  title: string;
  shortDescription: string;
  sortPriority: number;
  catalogGroupPriority: number;
}

export interface Storefront {
  refreshIntervalHrs: number;
  dailyPurchaseHrs: number;
  expiration: string;
  storefronts: {
    name: string;
    catalogEntries: StorefrontEntry[];
  }[];
}
