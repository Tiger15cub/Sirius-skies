import { DateTime, StringUnitLength } from "luxon";
import Account from "../../../../models/Accounts";
import log from "../../../../utils/log";
import { Response } from "express";
import { getProfile } from "../../utils/getProfile";
import { sendErrorResponse } from "../../../../utils";
import fs from "node:fs/promises";
import path from "node:path";

interface Variant {
  channel: string;
  active: string;
  owned?: string[];
}

const isValidVariant = (variant: any) =>
  typeof variant === "object" && variant.channel && variant.active;

export default async function EquipBattleRoyaleCustomization(
  accountId: string,
  slotName: string,
  itemToSlot: string,
  slotIndex: string,
  indexWithinSlot: number,
  variantUpdates: any[],
  lockerItem: string,
  profileId: string,
  rvn: number,
  res: Response
) {
  try {
    const account = await Account.findOne({ accountId });

    if (!account) {
      return res.status(404).json({ error: "Failed to find Account." });
    }

    const userProfiles: any = await getProfile(accountId);
    const applyProfileChanges: any[] = [];
    const itemToSlotExists = userProfiles.items[itemToSlot];

    if (userProfiles.items[itemToSlot]) {
      const itemTemplateId = userProfiles.items[itemToSlot].templateId;

      if (!itemTemplateId.startsWith(`Athena${slotName}:`))
        return sendErrorResponse(
          res,
          "errors.com.epicgames.fortnite.id_invalid",
          `Item ${itemTemplateId} not found to slot in cosmetic locker`
        );

      const variants = Array.isArray(variantUpdates);

      try {
        const variantsFilePath = path.join(
          __dirname,
          "..",
          "..",
          "..",
          "resources",
          "mcp",
          "Variants.json"
        );
        const variantsData = JSON.parse(
          await fs.readFile(variantsFilePath, "utf8")
        );

        const lowercasedTemplateId = itemTemplateId.toLowerCase();
        const variantToAdd = variantsData.find(
          (variant: { id: string }) =>
            variant.id.toLowerCase() === lowercasedTemplateId
        );

        if (variantToAdd && variantToAdd.variants) {
          userProfiles.items[itemToSlot].attributes.variants =
            variantToAdd.variants;
        }
      } catch (error) {
        log.error(
          `Failed to update Variant: ${error}`,
          "EquipBattleRoyaleCustomization"
        );
      }

      if (variants) {
        for (const variant of variantUpdates) {
          const { channel, active } = variant;

          if (channel && active) {
            if (userProfiles.items[itemToSlot].attributes.variants.length === 0)
              userProfiles.items[itemToSlot].attributes.variants =
                variantUpdates || [];

            const index = userProfiles.items[
              itemToSlot
            ].attributes.variants.findIndex((x: any) => x.channel === channel);

            if (index === -1) {
              userProfiles.items[itemToSlot].attributes.variants.push({
                channel,
                active,
                owned: [],
              });
            }

            const existingIndex = userProfiles.items[
              itemToSlot
            ].attributes.variants.findIndex((x: any) => x.channel === channel);
            userProfiles.items[itemToSlot].attributes.variants[
              existingIndex
            ].active = active;
          }

          applyProfileChanges.push({
            changeType: "itemAttrChanged",
            itemId: itemToSlot,
            attributeName: "variants",
            attributeValue: userProfiles.items[itemToSlot].attributes.variants,
          });
        }
      }
    }

    const activeLoadoutId =
      userProfiles.stats.attributes.loadouts[
      userProfiles.stats.attributes.active_loadout_index
      ];
    const cosmeticTemplateId =
      userProfiles.items[itemToSlot]?.templateId || itemToSlot;

    const updateFavoriteSlot = (slotType: string, index: number) => {
      userProfiles.stats.attributes[`favorite_${slotType.toLowerCase()}`] =
        itemToSlot;

      const lockerSlotsData =
        userProfiles.items[activeLoadoutId]?.attributes.locker_slots_data;
      if (lockerSlotsData && lockerSlotsData.slots[slotType]) {
        const slotItems = lockerSlotsData.slots[slotType].items;

        if (Array.isArray(slotItems)) {
          for (let i = 0; i < index; i++) {
            if (i < slotItems.length) {
              slotItems[i] = cosmeticTemplateId;
            }
          }
        }
      }
      applyProfileChanges.push({
        changeType: "itemAttrChanged",
        itemId: itemToSlot,
        attributeName: `favorite_${slotName.toLowerCase}`,
        attributeValue:
          userProfiles.stats.attributes[`favorite_${slotName.toLowerCase()}`],
      });

      if (indexWithinSlot === -1) {
        for (let i = 0; i < index; i++) {
          userProfiles.stats.attributes[`favorite_${slotType.toLowerCase()}`] =
            itemToSlot;

          const activeLoadout = userProfiles.items[activeLoadoutId];
          if (activeLoadout && activeLoadout.attributes.locker_slots_data) {
            const lockerSlotsData = activeLoadout.attributes.locker_slots_data;
            if (lockerSlotsData.slots[slotType]) {
              const slotItems = lockerSlotsData.slots[slotType].items;

              if (Array.isArray(slotItems)) {
                for (let i = 0; i < index; i++) {
                  if (i < slotItems.length) {
                    slotItems[i] = cosmeticTemplateId;
                  }
                }
              }
            }
          }
        }

        applyProfileChanges.push({
          changeType: "itemAttrChanged",
          itemId: itemToSlot,
          attributeName: `favorite_${slotName.toLowerCase}`,
          attributeValue:
            userProfiles.stats.attributes[`favorite_${slotName.toLowerCase()}`],
        });
      }
    };

    if (slotName === "Dance" && indexWithinSlot >= 0 && indexWithinSlot <= 5) {
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
      updateFavoriteSlot("ItemWrap", indexWithinSlot);
    } else {
      updateFavoriteSlot(slotName, 1);
    }

    res.json({
      profileRevision: userProfiles.rvn || 0,
      profileId,
      profileChangesBaseRevision: account.baseRevision || 0,
      profileChanges: applyProfileChanges,
      profileCommandRevision: userProfiles.commandRevision || 0,
      serverTime: DateTime.now().toISO(),
      responseVersion: 1,
    });

    if (applyProfileChanges.length > 0) {
      userProfiles.rvn += 1;
      userProfiles.commandRevision += 1;
      userProfiles.Updated = DateTime.now().toISO();

      await account.updateOne(
        { $set: { athena: userProfiles } },
        { writeConcern: { w: 0 } }
      );
    }
  } catch (error) {
    const err = error as Error;
    log.error(err.message, "EquipBattleRoyaleCustomization");
  }
}
