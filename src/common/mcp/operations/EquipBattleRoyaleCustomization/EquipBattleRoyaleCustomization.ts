import { DateTime } from "luxon";
import Account from "../../../../models/Accounts";
import log from "../../../../utils/log";
import { Response } from "express";
import { getProfile } from "../../utils/getProfile";
import { sendErrorResponse } from "../../../../utils";

interface Variant {
  channel: string;
  active: string;
  owned?: string[];
}

export default async function EquipBattleRoyaleCustomization(
  accountId: string,
  slotName: string,
  itemToSlot: string,
  slotIndex: string,
  indexWithinSlot: number,
  variantUpdates: Variant[],
  lockerItem: string,
  profileId: string,
  rvn: number,
  res: Response
) {
  try {
    const [userProfiles, account] = await Promise.all([
      getProfile(accountId),
      Account.findOne({ accountId }).select("athena").lean().exec(),
    ]);

    if (!account) {
      return res.status(404).json({ error: "Failed to find Account." });
    }

    const applyProfileChanges: any[] = [];
    const itemToSlotExists = userProfiles.items[itemToSlot];

    if (itemToSlotExists) {
      const itemTemplateId: string = userProfiles.items[itemToSlot].templateId;

      if (!itemTemplateId.startsWith(`Athena${slotName}:`)) {
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
        userProfiles.items[itemToSlot].attributes.variants =
          variantToAdd.variants;
      }

      if (variantUpdates.length > 0) {
        variantUpdates.forEach((variant) => {
          const { channel, active, owned } = variant;
          let hasVariant: boolean = true;

          if (
            channel === "Numeric" ||
            channel === "JerseyColor" ||
            channel === "RichColor"
          )
            hasVariant = false;

          /* if (!hasVariant) {
            const existingIndex: number = userProfiles.items[
              itemToSlot
            ].attributes.variants.findIndex(
              (x: { channel: string }) => x.channel === channel
            );

            if (existingIndex === -1) {

            }
          } */

          if (channel && active && hasVariant) {
            const existingIndex: number = userProfiles.items[
              itemToSlot
            ].attributes.variants.findIndex(
              (x: { channel: string }) => x.channel === channel
            );

            if (existingIndex === -1) {
              userProfiles.items[itemToSlot].attributes.variants.push({
                channel,
                active,
                owned,
              });
            } else {
              userProfiles.items[itemToSlot].attributes.variants[
                existingIndex
              ].active = active;
            }
          }
        });

        applyProfileChanges.push({
          changeType: "itemAttrChanged",
          itemId: itemToSlot,
          attributeName: "variants",
          attributeValue: userProfiles.items[itemToSlot].attributes.variants,
        });
      }
    }

    const activeLoadoutId =
      userProfiles.stats.attributes.loadouts[
        userProfiles.stats.attributes.active_loadout_index
      ];
    const cosmeticTemplateId =
      userProfiles.items[itemToSlot]?.templateId || itemToSlot;

    const updateFavoriteSlot = async (slotType: string, index: number) => {
      userProfiles.stats.attributes[`favorite_${slotType.toLowerCase()}`] =
        itemToSlot;

      const lockerSlotsData =
        userProfiles.items[activeLoadoutId]?.attributes.locker_slots_data;
      if (lockerSlotsData && lockerSlotsData.slots[slotType]) {
        const slotItems = lockerSlotsData.slots[slotType].items;

        if (Array.isArray(slotItems)) {
          for (let i = 0; i < Math.min(index, slotItems.length); i++) {
            slotItems[i] = cosmeticTemplateId;
          }
        }
      }

      applyProfileChanges.push({
        changeType: "itemAttrChanged",
        itemId: itemToSlot,
        attributeName: `favorite_${slotType.toLowerCase()}`,
        attributeValue:
          userProfiles.stats.attributes[`favorite_${slotType.toLowerCase()}`],
      });
    };

    const applyChanges = async (slotName: string, indexWithinSlot: number) => {
      if (
        slotName === "Dance" &&
        indexWithinSlot >= 0 &&
        indexWithinSlot <= 5
      ) {
        userProfiles.stats.attributes.favorite_dance[indexWithinSlot] =
          itemToSlot;

        const activeLoadout = userProfiles.items[activeLoadoutId];
        if (activeLoadout && activeLoadout.attributes.locker_slots_data) {
          const lockerSlotsData = activeLoadout.attributes.locker_slots_data;
          if (lockerSlotsData.slots[slotName]) {
            const slotItems = lockerSlotsData.slots[slotName].items;

            if (slotName === "Dance" && Array.isArray(slotItems)) {
              if (indexWithinSlot >= 0 && indexWithinSlot < slotItems.length) {
                slotItems[indexWithinSlot] = cosmeticTemplateId;
              }
            }
          }
        }

        applyProfileChanges.push({
          changeType: "itemAttrChanged",
          itemId: itemToSlot,
          attributeName: `favorite_${slotName.toLowerCase}`,
          attributeValue: userProfiles.stats.attributes[`favorite_dance`],
        });
      } else if (
        slotName === "ItemWrap" &&
        indexWithinSlot >= 0 &&
        indexWithinSlot <= 7
      ) {
        await updateFavoriteSlot("ItemWrap", indexWithinSlot);
      } else {
        await updateFavoriteSlot(slotName, 1);
      }
    };

    await applyChanges(slotName, indexWithinSlot);

    if (applyProfileChanges.length > 0) {
      userProfiles.rvn += 1;
      userProfiles.commandRevision += 1;
      userProfiles.Updated = DateTime.now().toISO();
    }

    const bulkUpdateOperations: any[] = [
      {
        updateOne: {
          filter: { accountId: accountId },
          update: { $set: { athena: userProfiles } },
          upsert: true,
        },
      },
    ];

    const updateTimeStart = process.hrtime.bigint();
    await Account.bulkWrite(bulkUpdateOperations);

    res.json({
      profileRevision: userProfiles.rvn || 0,
      profileId,
      profileChangesBaseRevision: account.baseRevision || 0,
      profileChanges: applyProfileChanges,
      profileCommandRevision: userProfiles.commandRevision || 0,
      serverTime: DateTime.now().toISO(),
      responseVersion: 1,
    });
  } catch (error) {
    log.error(`Error: ${error}`, "EquipBattleRoyaleCustomization");
    res.status(500).json({ error: "Internal Server Error" });
  }
}
