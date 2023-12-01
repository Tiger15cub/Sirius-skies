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

    const itemField = `${slotName.toString().toLowerCase()}.items`;

    const updateQuery: UpdateQuery = {
      $inc: { profilerevision: 1 },
    };

    let slotNames: any[] = [
      "Character",
      "Backpack",
      "Pickaxe",
      "Glider",
      "SkyDiveContrail",
      "MusicPack",
      "LoadingScreen",
    ];

    console.log(itemField);

    if (slotName === "ItemWrap" || slotName === "Dance") {
      updateQuery[itemField] =
        itemToSlot === ""
          ? ""
          : {
              [`${indexWithinSlot}`]: `${itemToSlot.split(":")[0]}:${
                itemToSlot.split(":")[1]
              }`,
            };
      console.log(itemField);
    } else {
      if (!slotNames.includes(slotName)) return { errorCode: "", message: "" };

      if (slotName == "Pickaxe" || slotName == "Glider") {
        if (!itemToSlot)
          return {
            errorCode: "errors.com.epicgames.fortnite.id_invalid",
            message: `${slotName} can not be empty.`,
            profileId: "athena",
          };
      }

      console.log(slotName);

      updateQuery[itemField] =
        itemToSlot === ""
          ? ""
          : `${itemToSlot.split(":")[0]}:${itemToSlot
              .split(":")[1]
              .toLowerCase()}`;
      console.log(itemField);
    }

    console.log(itemField);
    console.log(variantUpdates);

    if (variantUpdates.length !== 0) {
      updateQuery[`${slotName.toString().toLowerCase()}.activeVariants`] =
        variantUpdates;
    }

    console.log(itemField);
    console.log(variantUpdates);

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
          name: `favorite_${slotName.toLowerCase()}`,
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
