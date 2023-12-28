import { DateTime } from "luxon";
import Account from "../../../../models/Accounts";
import User from "../../../../models/Users";
import log from "../../../../utils/log";

export default async function EquipBattleRoyaleCustomization(
  accountId: string,
  slotName: string,
  itemToSlot: string,
  slotIndex: string,
  variantUpdates: any[],
  rvn: number
) {
  try {
    const account = await Account.findOne({
      accountId,
    }).lean();
    const category = slotName;

    if (!account) {
      return {};
    }

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

    const profileChanges: any[] = [];

    if (category === "ItemWrap" || category === "Dance") {
      if (parseInt(slotIndex ?? "0", 10) === -1) {
        if (itemToSlot === "Dance") {
          return {};
        }
      } else {
        if (itemToSlot === "") {
          await Account.updateOne(
            { accountId },
            {
              $set: {
                [`${category.toString().toLowerCase()}.items.${slotIndex}`]: "",
              },
            }
          );
        } else {
          await Account.updateOne(
            { accountId },
            {
              $set: {
                [`${category.toString().toLowerCase()}.items.${slotIndex}`]:
                  itemToSlot.toLowerCase(),
              },
            }
          );
        }
      }
    } else {
      if (itemToSlot === "") {
        await Account.updateOne(
          { accountId },
          {
            $set: {
              [`${category.toString().toLowerCase()}.items`]: "",
            },
          }
        );
      } else {
        await Account.updateOne(
          { accountId },
          {
            $set: {
              [`${category.toString().toLowerCase()}.items`]:
                itemToSlot.toString(),
            },
          }
        );
      }
    }

    const newProfileData = await Account.findOne({ accountId });

    if (!newProfileData) {
      return { error: "Failed to find New Profile." };
    }

    profileChanges.push({
      changeType: "statModified",
      name: `favorite_${category.toString().toLowerCase()}`,
      value: itemToSlot,
    });

    return {
      profileRevision: newProfileData.profilerevision,
      profileId: "athena",
      profileChangesBaseRevision: newProfileData.baseRevision,
      profileChanges,
      profileCommandRevision: rvn,
      serverTime: DateTime.now().toISO(),
      responseVersion: 1,
    };
  } catch (error) {
    let err = error as Error;
    log.error(err.message, "EquipBattleRoyaleCustomization");
  }
}
