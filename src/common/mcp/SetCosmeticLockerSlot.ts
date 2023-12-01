import { SetCosmeticLockerSlotUpdateQuery, UpdateQuery } from "../../interface";
import { SetCosmeticLockerSlotResult } from "../../interface/SetCosmeticLockerSlotResult";
import log from "../../utils/log";

export default async function SetCosmeticLockerSlot(
  Account: any,
  User: any,
  accountId: string,
  category: string,
  itemToSlot: string,
  slotIndex: number,
  variantUpdates: string,
  lockerItem: string,
  rvn: number
): Promise<SetCosmeticLockerSlotResult | { errorCode: string }> {
  try {
    const [account, user] = await Promise.all([
      Account.findOne({ accountId }).lean(),
      User.findOne({ accountId }).lean(),
    ]);

    if (!account || !user) {
      console.debug("Account or User not found");
      return {
        errorCode:
          "errors.com.funkyv2.backend.common.mcp.account_or_user.not_found",
        message: "Account or User not found.",
        profileId: "athena",
      };
    }

    if (category === undefined)
      return {
        errorCode: "errors.com.funkyv2.backend.common.mcp.category.undefined",
        message: "Category is undefined.",
        profileId: "athena",
      };

    await Account.updateOne(
      { accountId },
      { [`profilerevision`]: account.profilerevision + 1 }
    );

    switch (category) {
      case "ItemWrap":
      case "Dance":
        console.debug(category);
        if (itemToSlot === "" || itemToSlot == "")
          await Account.updateOne(
            { accountId },
            { [`${category.toString().toLowerCase()}.items`]: `` }
          );
        else
          await Account.updateOne(
            { accountId },
            {
              [`${category.toString().toLowerCase()}.items.${slotIndex}`]: `${
                itemToSlot.split(":")[0]
              }:${itemToSlot.split(":")[1]}`,
            }
          );
        break;

      default:
        console.debug(category);
        await Account.updateOne(
          { accountId },
          {
            [`${category.toString().toLowerCase()}.items`]: `${
              itemToSlot.split(":")[0]
            }:${itemToSlot.split(":")[1].toLowerCase()}`,
          }
        );
    }

    if (variantUpdates.length != 0)
      await Account.updateOne(
        { accountId },
        {
          [`${category.toString().toLowerCase()}.activeVariants`]:
            variantUpdates,
        }
      );

    const [newAccount] = await Promise.all([
      Account.findOne({ accountId }).lean(),
    ]);

    if (!newAccount)
      return {
        errorCode: "errors.com.funkyv2.backend.common.mcp.newAccount.not_found",
        message: "NewAccountData not found.",
        profileId: "athena",
      };

    return {
      profileId: "athena",
      profileChangesBaseRevision: newAccount.profilerevision,
      profileChanges: [
        {
          changeType: "statModified",
          name: `favorite_${category.toString().toLowerCase()}`,
          value: itemToSlot,
        },
      ],
      profileCommandRevision: newAccount.profilerevision,
      serverTime: new Date(),
      responseVersion: 1,
    };
  } catch (error) {
    const err: Error = error as Error;
    log.error(
      `Error in setCosmeticLockerSlot: ${err.message}`,
      "SetCosmeticLockerSlot"
    );
    throw error;
  }
}
