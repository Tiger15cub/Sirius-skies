import Account from "../../models/Accounts";
import User from "../../models/Users";
import log from "../../utils/log";
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
      return {
        error: "Account not found.",
      };
    }

    await updateAccountProfile(accountId, {
      $inc: { profilerevision: 1 },
    });

    const category = slotName;
    const categoryLowerCase = category.toString().toLowerCase();

    const updateObj: { [key: string]: any } = {
      [`${categoryLowerCase}.items`]: itemToSlot
        ? `${itemToSlot.split(":")[0]}:${itemToSlot
            .split(":")[1]
            .toLowerCase()}`
        : "",
    };

    if (variantUpdates?.length !== 0) {
      updateObj[`${categoryLowerCase}.activeVariants`] = variantUpdates;
    }

    await Account.updateOne({ accountId }, { $set: updateObj });

    const newAccountData = await getAccount(accountId);

    if (!newAccountData) {
      return {
        error: "Failed to get updated account data.",
      };
    }

    return {
      profileRevision: newAccountData.profilerevision,
      profileId: "athena",
      profileChangesBaseRevision: newAccountData.profilerevision,
      profileChanges: [
        {
          changeType: "statModified",
          name: `favorite_${categoryLowerCase}`,
          value: itemToSlot,
        },
      ],
      profileCommandRevision: newAccountData.profilerevision,
      serverTime: new Date(),
      responseVersion: 2,
    };
  } catch (error) {
    log.error(`An error occurred: ${error}`, "EquipBattleRoyaleCustomization");

    return {
      error: "An unexpected error occurred while processing the request.",
    };
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
