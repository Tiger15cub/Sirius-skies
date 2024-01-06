import { DateTime } from "luxon";
import Account from "../../../../models/Accounts";
import log from "../../../../utils/log";
import { Response } from "express";
import { getProfile } from "../../utils/getProfile";

interface ProfileChange {
  changeType: string;
  name: string;
  value: any;
}

export default async function EquipBattleRoyaleCustomization(
  accountId: string,
  slotName: string,
  itemToSlot: string,
  slotIndex: string,
  indexWithinSlot: number,
  variantUpdates: any[],
  rvn: number,
  res: Response
) {
  try {
    const account = await Account.findOne({
      accountId,
    }).lean();

    if (!account) {
      return res.status(404).json({ error: "Failed to find Account." });
    }

    const profile: any = await getProfile(accountId);
    const applyProfileChanges: ProfileChange[] = [];

    await Account.updateOne(
      { accountId },
      { $set: { [`profilerevision`]: account.profilerevision + 1 } }
    );

    await Account.updateOne(
      { accountId },
      {
        $set: {
          baseRevision: account.baseRevision + 1,
        },
      }
    );

    const updateFavoriteSlot = (slotType: string, index: number) => {
      profile.stats.attributes[`favorite_${slotType.toLowerCase()}`] =
        itemToSlot;
      profile.items[activeLoadoutId].attributes.locker_slots_data.slots[
        slotType
      ].items = [cosmeticTemplateId];

      applyProfileChanges.push({
        changeType: "statModified",
        name: `favorite_${slotType.toLowerCase()}`,
        value: profile.stats.attributes[`favorite_${slotType.toLowerCase()}`],
      });

      if (indexWithinSlot === -1) {
        for (let i = 0; i < index; i++) {
          profile.stats.attributes[`favorite_${slotType.toLowerCase()}`] =
            itemToSlot;
          profile.items[activeLoadoutId].attributes.locker_slots_data.slots[
            slotType
          ].items[i] = cosmeticTemplateId;
        }

        applyProfileChanges.push({
          changeType: "statModified",
          name: `favorite_${slotType.toLowerCase()}`,
          value: profile.stats.attributes[`favorite_${slotType.toLowerCase()}`],
        });
      }
    };

    const activeLoadoutId =
      profile.stats.attributes.loadouts[
        profile.stats.attributes.active_loadout_index
      ];
    const cosmeticTemplateId = profile.items[itemToSlot]
      ? profile.items[itemToSlot].templateId
      : itemToSlot;

    if (slotName === "Dance" && indexWithinSlot >= 0 && indexWithinSlot <= 5) {
      profile.stats.attributes.favorite_dance[indexWithinSlot] = itemToSlot;
      profile.items[
        activeLoadoutId
      ].attributes.locker_slots_data.slots.Dance.items[indexWithinSlot] =
        cosmeticTemplateId;

      applyProfileChanges.push({
        changeType: "statModified",
        name: "favorite_dance",
        value: profile.stats.attributes["favorite_dance"],
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

    const newProfileData = await Account.findOne({ accountId });

    if (!newProfileData) {
      return res.status(404).json({ error: "Failed to find new Profile." });
    }

    if (applyProfileChanges.length > 0) {
      profile.rvn += 1;
      profile.commandRevision += 1;
      profile.Updated = DateTime.now().toISO();
    }

    res.json({
      profileRevision: profile.rvn || 0,
      profileId: "athena",
      profileChangesBaseRevision: newProfileData.baseRevision,
      profileChanges: applyProfileChanges,
      profileCommandRevision: profile.commandRevision || 0,
      serverTime: DateTime.now().toISO(),
      responseVersion: 1,
    });

    if (applyProfileChanges.length > 0) {
      await Account.updateOne({
        $set: {
          athena: profile,
        },
      });
    }
  } catch (error) {
    let err = error as Error;
    log.error(err.message, "EquipBattleRoyaleCustomization");
  }
}
