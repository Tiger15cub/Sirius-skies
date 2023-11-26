export function mapPurchasesData(items: any[]): any[] {
  return items.map((e) => {
    const firstKey = Object.keys(e)[0];
    const templateId = e[firstKey].templateId;
    return {
      purchaseId: templateId,
      offerId: `v2:/${templateId}`,
      purchaseDate: "9999-12-31T00:00:00.000Z",
      freeRefundEligible: false,
      fulfillments: [],
      lootResult: [
        {
          itemType: templateId,
          itemGuid: templateId,
          itemProfile: "athena",
          quantity: 1,
        },
      ],
      totalMtxPaid: 0,
      metadata: {},
      gameContext: "",
    };
  });
}
