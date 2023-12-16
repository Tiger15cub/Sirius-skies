import Account from "../../../../models/Accounts";
import User from "../../../../models/Users";
import log from "../../../../utils/log";

export default async function SetCosmeticLockerSlot(
  accountId: string,
  slotName: string,
  itemToSlot: string,
  slotIndex: number,
  rvn: number
) {
  try {
    const account = await Account.findOne({ accountId }).lean();
    const user = await User.findOne({ accountId }).lean();

    if (!account) {
      return {};
    }

    if (!user) {
      return {};
    }

    await Account.updateOne(
      { accountId },
      { $set: { profilerevision: account.profilerevision + 1 } }
    );

    if (slotName === "ItemWrap" || slotName === "Dance") {
      if (slotIndex === -1) {
        if (slotName === "Dance") {
          return log.error("Error Found", "SetCosmeticLockerSlot");
        }
      } else {
        if (itemToSlot === "") {
          await Account.updateOne(
            { accountId },
            { $set: { [`${slotName.toLowerCase()}.items.${slotIndex}`]: "" } }
          );
        } else {
          await Account.updateOne(
            { accountId },
            {
              $set: {
                [`${slotName.toLowerCase()}.items.${slotIndex}`]: `${
                  itemToSlot.split(":")[0]
                }:${itemToSlot.split(":")[1].toLowerCase()}`,
              },
            }
          );
        }
      }
    } else {
      if (itemToSlot === "") {
        await Account.updateOne(
          { accountId },
          { $set: { [`${slotName.toLowerCase()}.items`]: "" } }
        );
      } else {
        await Account.updateOne(
          { accountId },
          {
            $set: {
              [`${slotName.toLowerCase()}.items`]: `${
                itemToSlot.split(":")[0]
              }:${itemToSlot.split(":")[1].toLowerCase()}`,
            },
          }
        );
      }
    }
    let updatedProfile: any[] = [
      {
        changeType: "statModified",
        name: `favorite_${slotName.toLowerCase()}`,
        value: itemToSlot,
      },
    ];

    const newAccountData = await Account.findOne({ accountId }).lean();

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
    let err = error as Error;
    log.error(err.message, "SetCosmeticLockerSlot");
  }
}
