export default function AddGift(
  item: any,
  itemType: string,
  itemID: string,
  itemProfile: string,
  quantity: number
) {
  item.attributes.lootList.push({
    itemType: itemType,
    itemGuid: itemID,
    itemProfile: itemProfile,
    quantity: quantity,
  });
}
