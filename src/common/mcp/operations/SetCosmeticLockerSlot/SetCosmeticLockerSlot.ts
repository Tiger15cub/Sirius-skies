import { DateTime } from "luxon";
import Account from "../../../../models/Accounts";
import User from "../../../../models/Users";
import log from "../../../../utils/log";
import { getProfile } from "../../utils/getProfile";
import { Response } from "express";
import { sendErrorResponse } from "../../../../utils";

export default async function SetCosmeticLockerSlot(
  accountId: string,
  category: string,
  itemToSlot: string,
  slotIndex: number,
  variantUpdates: any[],
  lockerItem: string,
  rvn: number,
  res: Response
) {
  try {
    const account = await Account.findOne({ accountId }).lean();
    const user = await User.findOne({ accountId }).lean();
    const profile = await getProfile(accountId);

    if (!account || !user) {
      return res.json({ error: "Account or User not found." });
    }

    let matchingItemId: string = "";
    const applyProfileChanges: any[] = [];
    const variants = Array.isArray(variantUpdates);

    const getMatchingItemId = (itemToSlot: string) => {
      for (const item in profile.items) {
        if (profile.items[item].templateId === itemToSlot) {
          matchingItemId = item;
          break;
        }
      }
    };

    if (itemToSlot) {
      getMatchingItemId(itemToSlot);
    }

    if (profile.items[itemToSlot]) {
      const itemTemplateId = profile.items[itemToSlot].templateId;

      if (!itemTemplateId.startsWith(`Athena${category}:`))
        return sendErrorResponse(
          res,
          "errors.com.epicgames.fortnite.id_invalid",
          `Item ${itemTemplateId} not found to slot in cosmetic locker`
        );

      if (variants) {
        for (const variant of variantUpdates) {
          const { channel, active } = variant;

          const index = profile.items[itemToSlot].attributes.variants.findIndex(
            (x: any) => x.channel === channel
          );

          if (index === -1) continue;

          profile.items[itemToSlot].attributes.variants[index].active = active;
        }

        applyProfileChanges.push({
          changeType: "itemAttrChanged",
          itemId: itemToSlot,
          attributeName: "variants",
          attributeValue: profile.items[itemToSlot].attributes.variants,
        });
      }
    }

    const updateItemWrapSlot = () => {
      const slotData = profile.items[lockerItem].attributes.locker_slots_data;
      const items = slotData.slots.ItemWrap.items;

      for (let i = 0; i < items.length; i++) {
        items[i] = itemToSlot;
        profile.stats.attributes.favorite_itemwraps[i] =
          matchingItemId || itemToSlot;
      }

      applyProfileChanges.push({
        changeType: "itemAttrChanged",
        itemId: lockerItem,
        attributeName: "locker_slots_data",
        attributeValue: slotData,
      });
    };

    const updateCategorySlot = () => {
      const slotData = profile.items[lockerItem].attributes.locker_slots_data;
      slotData.slots[category].items = [itemToSlot];
      profile.stats.attributes[`favorite_${category.toLowerCase()}`] =
        matchingItemId || itemToSlot;

      applyProfileChanges.push({
        changeType: "itemAttrChanged",
        itemId: lockerItem,
        attributeName: "locker_slots_data",
        attributeValue: slotData,
      });
    };

    await Account.updateOne(
      { accountId },
      { $set: { profilerevision: account.profilerevision + 1 } }
    );

    if (category === "Dance" && slotIndex >= 0 && slotIndex <= 5) {
      const slotData = profile.items[lockerItem].attributes.locker_slots_data;
      slotData.slots.Dance.items[slotIndex] = itemToSlot;
      profile.stats.attributes.favorite_dance[slotIndex] =
        matchingItemId || itemToSlot;

      applyProfileChanges.push({
        changeType: "itemAttrChanged",
        itemId: lockerItem,
        attributeName: "locker_slots_data",
        attributeValue: slotData,
      });
    } else if (category === "ItemWrap" && slotIndex >= 0 && slotIndex <= 7) {
      updateItemWrapSlot();
    } else if (slotIndex === -1) {
      updateItemWrapSlot();
    } else {
      if (
        category &&
        profile.items[lockerItem].attributes.locker_slots_data.slots[category]
      ) {
        updateCategorySlot();
      }
    }

    if (applyProfileChanges.length > 0) {
      profile.rvn += 1;
      profile.commandRevision += 1;
      profile.Updated = DateTime.now().toISO();
    }

    res.json({
      profileRevision: profile.rvn || 0,
      profileId: "athena",
      profileChangesBaseRevision: account.baseRevision || 0,
      profileChanges: applyProfileChanges,
      profileCommandRevision: profile.commandRevision || 0,
      serverTime: DateTime.now().toISO(),
      responseVersion: 1,
    });

    if (applyProfileChanges.length > 0) {
      await Account.updateOne(
        { accountId },
        {
          $set: {
            athena: profile,
          },
        }
      );
    }
  } catch (error) {
    let err = error as Error;
    log.error(err.message, "SetCosmeticLockerSlot");
  }
}
