import Accounts from "../../../../models/Accounts";
import Users from "../../../../models/Users";

export default async function EquipBattleRoyaleCustomization(
  slotName: string,
  accountId: string,
  itemToSlot: string,
  indexWithinSlot: string,
  variantUpdates: string[]
) {
  if (slotName === undefined) return;

  const account = await Accounts.findOne({ accountId }).lean();
  const user = await Users.findOne({ accountId }).lean();

  if (!account || !user) {
    return {
      errorCode:
        "sirius.src.common.mcp.operations.EquipBattleRoyaleCustomization.EquipBattleRoyaleCustomization.not_found",
      errorMessage: "Account or User not found.",
    };
  }

  await Accounts.updateOne(
    { accountId },
    { ["profilerevision"]: account.profilerevision + 1 }
  );

  if (slotName == "ItemWrap" || slotName == "Dance") {
    if (itemToSlot == "") {
      await Accounts.updateOne(
        { accountId },
        {
          [`${slotName.toString().toLowerCase()}.items.${indexWithinSlot}`]: ``,
        }
      );
    } else {
      await Accounts.updateOne(
        { accountId },
        {
          [`${slotName.toString().toLowerCase()}.items.${indexWithinSlot}`]: `${
            itemToSlot.split(":")[0]
          }:${itemToSlot.split(":")[1]}`,
        }
      );
    }
  } else {
    if (itemToSlot == "") {
      await Accounts.updateOne(
        { accountId },
        { [`${slotName.toString().toLowerCase()}.items`]: `` }
      );
    } else {
      await Accounts.updateOne(
        { accountId },
        {
          [`${slotName.toString().toLowerCase()}.items`]: `${
            itemToSlot.split(":")[0]
          }:${itemToSlot.split(":")[1].toLowerCase()}`,
        }
      );
    }
  }

  if (variantUpdates.length != 0) {
    await Accounts.updateOne(
      { accountId },
      {
        [`${slotName.toLowerCase()}.activeVariants`]: variantUpdates,
      }
    );
  }

  const updatedProfile = await Accounts.findOne({ accountId });

  if (!updatedProfile) {
    return {
      errorCode:
        "sirius.src.common.mcp.operations.EquipBattleRoyaleCustomization.EquipBattleRoyaleCustomization.not_found",
      errorMessage: "Updated Profile not found.",
    };
  }

  return {
    profileRevision: updatedProfile.profilerevision,
    profileId: "athena",
    profileChangesBaseRevision: updatedProfile.profilerevision,
    profileChanges: [
      {
        changeType: "statModified",
        name: `favorite_${slotName.toLowerCase()}`,
        value: itemToSlot,
      },
    ],
    profileCommandRevision: updatedProfile.profilerevision,
    serverTime: new Date().toISOString(),
    responseVersion: 1,
  };
}
