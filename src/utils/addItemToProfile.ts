export default function addItemToProfile(
  item: { item: string },
  itemUUID: string,
  userProfiles: any,
  multiUpdate: any[],
  notifications: any[]
) {
  const profileItem = {
    templateId: item.item,
    attributes: {
      item_seen: false,
      variants: [],
    },
    quantity: 1,
  };

  userProfiles.items[item.item] = profileItem;

  multiUpdate.push({
    changeType: "itemAdded",
    itemId: itemUUID,
    item: profileItem,
  });

  notifications.push({
    itemType: item.item,
    itemGuid: itemUUID,
    itemProfile: "athena",
    quantity: 1,
  });
}
