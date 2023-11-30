import { SetCosmeticLockerSlotUpdateQuery, UpdateQuery } from "../../interface";
import { SetCosmeticLockerSlotResult } from "../../interface/SetCosmeticLockerSlotResult";
import log from "../../utils/log";

export default async function SetCosmeticLockerSlot(
  Account: any,
  User: any,
  accountId: string,
  slotName: string,
  itemToSlot: string,
  slotIndex: number,
  rvn: number
): Promise<SetCosmeticLockerSlotResult | { errorCode: string }> {
  try {
    const [account, user] = await Promise.all([
      Account.findOne({ accountId }).lean(),
      User.findOne({ accountId }).lean(),
    ]);
    if (!account || !user) {
      return {
        errorCode:
          "errors.com.funkyv2.backend.common.mcp.account_or_user.not_found",
        message: "Account or User not found.",
        profileId: "athena",
      };
    }

    const updateQuery: SetCosmeticLockerSlotUpdateQuery = {
      $set: {
        profilerevision: account.profilerevision + 1,
        baseRevision: account.baseRevision + 1,
      },
    };

    if (!updateQuery) return { errorCode: "" };

    if (slotName === "ItemWrap" || slotName === "Dance") {
      if (slotIndex !== -1) {
        if (itemToSlot === "") {
          updateQuery.$set[`${slotName.toLowerCase()}.items.${slotIndex}`] = "";
        } else {
          updateQuery.$set[`${slotName.toLowerCase()}.items.${slotIndex}`] = `${
            itemToSlot.split(":")[0]
          }:${itemToSlot.split(":")[1].toLowerCase()}`;
        }
      }
    } else {
      if (itemToSlot === "") {
        updateQuery.$set[`${slotName.toLowerCase()}.items`] = `${
          itemToSlot.split(":")[0]
        }:${itemToSlot.split(":")[1].toLowerCase()}`;
      }
    }

    await Account.updateOne({ accountId }, updateQuery);

    const updatedProfile = [
      {
        changeType: "statModified",
        name: `favorite_${slotName.toLowerCase()}`,
        value: itemToSlot,
      },
    ];

    const [newAccount] = await Promise.all([
      Account.findOne({ accountId }).lean(),
    ]);

    if (!newAccount) {
      return {
        errorCode: "errors.com.funkyv2.backend.common.mcp.account.not_found",
        message: "Account not found.",
        profileId: "athena",
      };
    }

    return {
      profileId: "athena",
      profileChangesBaseRevision: rvn,
      profileChanges: updatedProfile,
      profileCommandRevision: newAccount.profilerevision,
      serverTime: new Date(),
      responseVersion: 1,
    };
  } catch (error) {
    const err: Error = error as Error;
    log.error(
      `Error in setCosmeticLockerSlot: ${err.message}`,
      "setCosmeticLockerSlot"
    );
    throw error;
  }
}
