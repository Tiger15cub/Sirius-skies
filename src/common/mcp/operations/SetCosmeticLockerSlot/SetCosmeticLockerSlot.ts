import { DateTime } from "luxon";
import Account from "../../../../models/Accounts";
import User from "../../../../models/Users";
import log from "../../../../utils/log";

export default async function SetCosmeticLockerSlot(
  accountId: string,
  slotName: string,
  itemToSlot: string,
  slotIndex: string,
  variantUpdates: any[],
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

    if (slotName === "ItemWrap" || slotName === "Dance") {
      if (parseInt(slotIndex ?? "0") === -1) {
        if (slotName === "Dance") {
          return {};
        }

        let itemToSlotValues: string[] = [];

        // @ts-ignore
        itemToSlotValues = Array.from(
          // @ts-ignore
          { length: account[slotName]["items"].length },
          () => itemToSlot.toLowerCase()
        );
        await Account.updateOne(
          { accountId },
          {
            $set: {
              [`${slotName}`]: itemToSlotValues,
            },
          }
        );

        console.log(itemToSlot);
      } else {
        if (itemToSlot === "") {
          await Account.updateOne(
            { accountId },
            {
              $set: {
                [`${slotName}.items.${slotIndex}`]: "",
              },
            }
          );
        } else {
          await Account.updateOne(
            { accountId },
            {
              $set: {
                [`${slotName}.items.${slotIndex}`]: itemToSlot.toLowerCase(),
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
              [`${slotName}.items`]: "",
            },
          }
        );
      } else {
        await Account.updateOne(
          { accountId },
          {
            $set: {
              [`${slotName}.items`]: itemToSlot.toLowerCase(),
            },
          }
        );
      }
    }

    for (const variant of variantUpdates) {
      if (variant.channel !== null && variant.active !== null) {
        await Account.updateOne(
          { accountId },
          {
            $set: {
              [`${slotName}.activeVariants`]: [
                [
                  {
                    ...variant,
                  },
                ],
              ],
            },
          }
        );

        profileChanges.push({
          changeType: "itemAttrChanged",
          itemId: slotName.toString().toLowerCase(),
          attributeName: "variants",
          attributeValue: variant,
        });
      } else {
        return {};
      }
    }

    const newProfileData = await Account.findOne({ accountId });

    if (!newProfileData) {
      return { error: "Failed to find New Profile." };
    }

    profileChanges.push({
      changeType: "statModified",
      name: `favorite_${slotName.toString().toLowerCase()}`,
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
    log.error(err.message, "SetCosmeticLockerSlot");
  }
}
