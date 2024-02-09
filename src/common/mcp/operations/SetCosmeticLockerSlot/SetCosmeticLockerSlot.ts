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
    const [account, user, profile] = await Promise.all([
      Account.findOne({ accountId }).cacheQuery(),
      User.findOne({ accountId }).cacheQuery(),
      getProfile(accountId),
    ]);

    if (!account || !user) {
      return res.json({ error: "Account or User not found." });
    }

    let matchingItemId: string = "";
    const applyProfileChanges: any[] = [];
    const variants = Array.isArray(variantUpdates);

    for (const itemId in profile.items) {
      if (profile.items[itemId].templateId === itemToSlot) {
        matchingItemId = itemId;
        break;
      }
    }

    const itemToSlotExists = profile.items[itemToSlot];

    if (itemToSlotExists) {
      const itemTemplateId: string = profile.items[itemToSlot].templateId;

      if (!itemTemplateId.startsWith(`Athena${category}:`)) {
        return sendErrorResponse(
          res,
          "errors.com.epicgames.fortnite.id_invalid",
          `Item ${itemTemplateId} not found to slot in cosmetic locker`
        );
      }

      const variantsData: any[] = require("../../../resources/mcp/Variants.json");
      const lowercasedTemplateId: string = itemTemplateId.toLowerCase();
      const variantToAdd = variantsData.find(
        (variant: any) => variant.id.toLowerCase() === lowercasedTemplateId
      );

      if (variantToAdd && variantToAdd.variants) {
        profile.items[itemToSlot].attributes.variants = variantToAdd.variants;
      }

      if (variantUpdates.length > 0) {
        variantUpdates.forEach((variant) => {
          const { channel, active, owned } = variant;
          let hasVariant: boolean = true;

          if (channel === "Numeric" || channel === "JerseyColor")
            hasVariant = false;

          if (channel && active && hasVariant) {
            const existingIndex: number = profile.items[
              itemToSlot
            ].attributes.variants.findIndex(
              (x: { channel: string }) => x.channel === channel
            );

            if (existingIndex === -1) {
              profile.items[itemToSlot].attributes.variants.push({
                channel,
                active,
                owned,
              });
            } else {
              profile.items[itemToSlot].attributes.variants[
                existingIndex
              ].active = active;
            }
          }
        });

        applyProfileChanges.push({
          changeType: "itemAttrChanged",
          itemId: itemToSlot,
          attributeName: "variants",
          attributeValue: profile.items[itemToSlot].attributes.variants,
        });
      }
    }

    const updateFavoriteSlot = (slotName: string, items: any[]) => {
      const slotData = profile.items[lockerItem].attributes.locker_slots_data;
      if (slotData && slotData.slots[slotName]) {
        slotData.slots[slotName].items = items;
        profile.stats.attributes[`favorite_${slotName.toLowerCase()}`] =
          matchingItemId || itemToSlot;
        applyProfileChanges.push({
          changeType: "itemAttrChanged",
          itemId: lockerItem,
          attributeName: "locker_slots_data",
          attributeValue: slotData,
        });
      }
    };

    const updateItemWrapSlot = () => {
      const slotData = profile.items[lockerItem].attributes.locker_slots_data;
      const items = slotData.slots.ItemWrap.items.fill(itemToSlot);
      profile.stats.attributes.favorite_itemwraps = items.map(
        () => matchingItemId || itemToSlot
      );
      applyProfileChanges.push({
        changeType: "itemAttrChanged",
        itemId: lockerItem,
        attributeName: "locker_slots_data",
        attributeValue: slotData,
      });
    };

    if (category === "Dance" && slotIndex >= 0 && slotIndex <= 5) {
      const slotData = profile.items[lockerItem].attributes.locker_slots_data;
      if (slotData && slotData.slots.Dance) {
        slotData.slots.Dance.items[slotIndex] = itemToSlot;
        profile.stats.attributes.favorite_dance[slotIndex] =
          matchingItemId || itemToSlot;
        applyProfileChanges.push({
          changeType: "itemAttrChanged",
          itemId: lockerItem,
          attributeName: "locker_slots_data",
          attributeValue: slotData,
        });
      }
    } else {
      if (category === "ItemWrap" && slotIndex >= 0 && slotIndex <= 7) {
        updateItemWrapSlot();
      } else if (slotIndex === -1) {
        updateItemWrapSlot();
      } else {
        updateFavoriteSlot(category, [itemToSlot]);
      }
    }

    if (applyProfileChanges.length > 0) {
      profile.rvn += 1;
      profile.commandRevision += 1;
      profile.Updated = DateTime.now().toISO();

      await Account.updateOne(
        { accountId },
        {
          $set: {
            athena: profile,
            profilerevision: account.profilerevision + 1,
          },
        }
      ).cacheQuery();

      res.json({
        profileRevision: profile.rvn || 0,
        profileId: "athena",
        profileChangesBaseRevision: account.baseRevision || 0,
        profileChanges: applyProfileChanges,
        profileCommandRevision: profile.commandRevision || 0,
        serverTime: DateTime.now().toISO(),
        responseVersion: 1,
      });
    } else {
      res.json({
        profileRevision: profile.rvn || 0,
        profileId: "athena",
        profileChangesBaseRevision: account.baseRevision || 0,
        profileChanges: [],
        profileCommandRevision: profile.commandRevision || 0,
        serverTime: DateTime.now().toISO(),
        responseVersion: 1,
      });
    }
  } catch (error) {
    log.error(`Error: ${error}`, "SetCosmeticLockerSlot");
    res.status(500).json({ error: "Internal Server Error" });
  }
}
