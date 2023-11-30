import { EquipResult, UpdateQuery } from "../../interface";
import log from "../../utils/log";

export default async function equipBattleRoyaleCustomization(
  Account: any,
  accountId: string,
  profileId: string,
  slotName: string,
  itemToSlot: string,
  indexWithinSlot: string,
  variantUpdates: string,
  rvn: number
): Promise<EquipResult | { errorCode: string; message: string }> {
  try {
    const [account] = await Promise.all([
      Account.findOne({ accountId }).lean(),
    ]);

    if (!account) {
      return {
        errorCode: "errors.com.funkyv2.backend.common.mcp.account.not_found",
        message: "Account not found.",
      };
    }

    const category = slotName.toLowerCase();
    const itemField = `${category}.items`;

    const updateQuery: UpdateQuery = {
      $inc: { profilerevision: 1 },
    };

    if (slotName === "ItemWrap" || slotName === "Dance") {
      updateQuery[itemField] =
        itemToSlot === ""
          ? ""
          : {
              [`${indexWithinSlot}`]: `${itemToSlot.split(":")[0]}:${
                itemToSlot.split(":")[1]
              }`,
            };
    } else {
      updateQuery[itemField] =
        itemToSlot === ""
          ? ""
          : `${itemToSlot.split(":")[0]}:${itemToSlot
              .split(":")[1]
              .toLowerCase()}`;
    }

    if (variantUpdates.length !== 0) {
      updateQuery[`${category}.activeVariants`] = variantUpdates;
    }

    await Account.updateOne({ accountId }, updateQuery);

    const newProfile = await Account.findOne({ accountId }).lean();

    if (!newProfile) {
      return {
        errorCode: "errors.com.funkyv2.backend.common.mcp.account.not_found",
        message: "Account not found.",
        profileId: "athena",
      };
    }

    return {
      profileRevision: newProfile.profilerevision,
      profileId: "athena",
      profileChangesBaseRevision: newProfile.profilerevision,
      profileChanges: [
        {
          changeType: "statModified",
          name: `favorite_${category}`,
          value: itemToSlot,
        },
      ],
      profileCommandRevision: newProfile.profilerevision,
      serverTime: new Date(),
      responseVersion: 2,
    };
  } catch (error) {
    let err: Error = error as Error;
    log.error(
      `Error in EquipBattleRoyaleCustomization: ${err.message}`,
      "EquipBattleRoyaleCustomization"
    );
    throw error;
  }
}
