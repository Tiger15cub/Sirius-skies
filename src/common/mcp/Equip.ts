import Account from "../../models/Accounts";
import User from "../../models/Users";
import logger from "../../utils/log";

async function updateAccountProfile(accountId: string, update: any) {
  await Account.updateOne({ accountId }, update);
}

async function getAccount(accountId: string) {
  return await Account.findOne({ accountId }).lean();
}

async function getUser(accountId: string) {
  return await User.findOne({ accountId }).lean();
}

export async function EquipBattleRoyaleCustomization(
  accountId: string,
  profileId: string,
  slotName: string,
  itemToSlot: string,
  indexWithinSlot: string,
  variantUpdates: string,
  rvn: number
) {
  try {
    const account = await getAccount(accountId);

    if (!account) {
      return {};
    }

    await updateAccountProfile(accountId, {
      $inc: { profilerevision: 1 },
    });

    const category = slotName.toLowerCase();
    const categoryItemsKey =
      category === "itemwrap" || category === "dance"
        ? "items"
        : `items.${indexWithinSlot}`;

    if (itemToSlot === "") {
      await updateAccountProfile(accountId, {
        $set: { [`${category}.${categoryItemsKey}`]: "" },
      });
    } else {
      const itemKey = itemToSlot.split(":")[0];
      const itemValue = itemToSlot.split(":")[1].toLowerCase();

      await updateAccountProfile(accountId, {
        $set: {
          [`${category}.${categoryItemsKey}`]: `${itemKey}:${itemValue}`,
        },
      });
    }

    if (variantUpdates.length !== 0) {
      await updateAccountProfile(accountId, {
        $set: { [`${category}.activeVariants`]: variantUpdates },
      });
    }

    const newAccountProfile = await getAccount(accountId);

    if (!newAccountProfile) {
      return {};
    }

    const responseData = {
      profileRevision: newAccountProfile.profilerevision,
      profileId: "athena",
      profileChangesBaseRevision: newAccountProfile.profilerevision,
      profileChanges: [
        {
          changeType: "statModified",
          name: `favorite_${category}`,
          value: itemToSlot,
        },
      ],
      profileCommandRevision: newAccountProfile.profilerevision,
      serverTime: new Date(),
      responseVersion: 2,
    };

    return responseData;
  } catch (error) {
    let err: Error = error as Error;
    logger.error(err.message, "EquipBattleRoyaleCustomization");
  }
}

export async function SetCosmeticLockerSlot(
  accountId: string,
  profileId: string,
  slotName: string,
  itemToSlot: string,
  slotIndex: number,
  variantUpdates: string[],
  rvn: number
) {
  try {
    const account = await getAccount(accountId);
    const user = await getUser(accountId);

    if (!account || !user) {
      return {};
    }

    await updateAccountProfile(accountId, {
      $inc: { profilerevision: 1, BaseRevision: 1 },
    });

    const category = slotName.toLowerCase();
    const categoryItemsKey = slotIndex === -1 ? "items" : `items.${slotIndex}`;

    if (slotName === "dance" && slotIndex === -1) {
      logger.error("Error Found", "SetCosmeticLockerSlot");
    } else {
      if (itemToSlot === "") {
        await updateAccountProfile(accountId, {
          $set: { [`${category}.${categoryItemsKey}`]: "" },
        });
      } else {
        const itemKey = itemToSlot.split(":")[0];
        const itemValue = itemToSlot.split(":")[1].toLowerCase();

        await updateAccountProfile(accountId, {
          $set: {
            [`${category}.${categoryItemsKey}`]: `${itemKey}:${itemValue}`,
          },
        });
      }
    }

    const updatedProfile = [
      {
        changeType: "statModified",
        name: `favorite_${category}`,
        value: itemToSlot,
      },
    ];

    const newAccountData = await getAccount(accountId);

    if (!newAccountData) {
      return {};
    }

    const response = {
      profileId: "athena",
      profileChangesBaseRevision: rvn,
      profileChanges: updatedProfile,
      profileCommandRevision: newAccountData.profilerevision,
      serverTime: new Date().toISOString(),
      responseVersion: 1,
    };

    return response;
  } catch (error) {
    let err: Error = error as Error;
    logger.error(err.message, "SetCosmeticLockerSlot");
  }
}
