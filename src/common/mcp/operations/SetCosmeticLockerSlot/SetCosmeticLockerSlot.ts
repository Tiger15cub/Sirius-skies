import Accounts from "../../../../models/Accounts";
import Users from "../../../../models/Users";

export default async function SetCosmeticLockerSlot(
  category: string,
  itemToSlot: string,
  accountId: string,
  slotIndex: number,
  variantUpdates: string[]
) {
  if (category === undefined) return;

  const account = await Accounts.findOne({ accountId }).lean();
  const user = await Users.findOne({ accountId }).lean();

  if (!account || !user) {
    return {
      errorCode:
        "sirius.src.common.mcp.operations.SetCosmeticLockerSlot.SetCosmeticLockerSlot.not_found",
      errorMessage: "Account or User not found.",
    };
  }

  await Accounts.updateOne(
    { accountId },
    { ["profilerevision"]: account.profilerevision + 1 }
  );

  // let categories: any[] = ["ItemWrap", "Dance"];

  switch (category) {
    case "ItemWrap":
    case "Dance":
      console.debug(category);
      if (itemToSlot === "") {
        await Accounts.updateOne(
          { accountId },
          { [`${category.toLowerCase()}.items`]: "" }
        );
      } else {
        const updateValue =
          category === "Dance"
            ? `${itemToSlot.split(":")[0]}:${itemToSlot
                .split(":")[1]
                .toLowerCase()}`
            : `${itemToSlot.split(":")[0]}:${itemToSlot.split(":")[1]}`;

        await Accounts.updateOne(
          { accountId },
          {
            [`${category.toLowerCase()}.items.${slotIndex}`]: updateValue,
          }
        );
      }
      break;

    default:
      if (itemToSlot === "") {
        await Accounts.updateOne(
          { accountId },
          { [`${category.toLowerCase()}.items`]: "" }
        );
      } else {
        console.debug(category);
        await Accounts.updateOne(
          { accountId },
          {
            [`${category.toLowerCase()}.items`]: `${
              itemToSlot.split(":")[0]
            }:${itemToSlot.split(":")[1].toLowerCase()}`,
          }
        );
      }
      break;
  }

  if (variantUpdates.length != 0) {
    await Accounts.updateOne(
      { accountId },
      { [`${category.toLowerCase()}.activeVariants`]: variantUpdates }
    );
  }

  const updatedProfile = await Accounts.findOne({ accountId });

  if (!updatedProfile) {
    return {
      errorCode:
        "sirius.src.common.mcp.operations.SetCosmeticLockerSlot.SetCosmeticLockerSlot.not_found",
      errorMessage: "Updated Profile not found.",
    };
  }

  return {
    profileId: "athena",
    profileChangesBaseRevision: updatedProfile.profilerevision,
    profileChanges: [
      {
        changeType: "statModified",
        name: `favorite_${category.toLowerCase()}`,
        value: itemToSlot,
      },
    ],
    profileCommandRevision: updatedProfile.profilerevision,
    serverTime: new Date(),
    responseVersion: 1,
  };
}
