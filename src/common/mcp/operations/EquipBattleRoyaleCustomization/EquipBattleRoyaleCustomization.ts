import Account from "../../../../models/Accounts";
import User from "../../../../models/Users";
import log from "../../../../utils/log";

export default async function EquipBattleRoyaleCustomization(
  accountId: string,
  slotName: string,
  itemToSlot: string,
  indexWithinSlot: string,
  variantUpdates: string,
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
      { [`profilerevision`]: account.profilerevision + 1 }
    );

    if (category === "ItemWrap" || category === "Dance") {
      // Debug log
      console.log(category);

      if (itemToSlot == "") {
        await Account.updateOne(
          { accountId },
          { [`${category.toString().toLowerCase()}`]: `` }
        );
      } else {
        await Account.findOne(
          { accountId },
          {
            [`${category
              .toString()
              .toLowerCase()}.items.${indexWithinSlot}`]: `${
              itemToSlot.split(":")[0]
            }:${itemToSlot.split(":")[1]}`,
          }
        );
      }
    } else {
      if (itemToSlot === "") {
        await Account.updateOne(
          { accountId },
          { [`${category.toString().toLowerCase()}.items`]: `` }
        );
      } else {
        await Account.updateOne(
          { accountId },
          {
            [`${category.toString().toLowerCase()}.items`]: `${
              itemToSlot.split(":")[0]
            }:${itemToSlot.split(":")[1].toLowerCase()}`,
          }
        );
      }
    }

    // Debug log
    console.log(variantUpdates);

    if (variantUpdates.length != 0) {
      await Account.updateOne(
        { accountId },
        {
          [`${category.toString().toLowerCase()}.activeVariants`]:
            variantUpdates,
        }
      );
    }

    const newAccountProfile = await Account.findOne({ accountId }).lean();

    // Debug log
    console.log(rvn);

    if (!newAccountProfile) {
      return {};
    }

    const responseData = {
      profileRevision: newAccountProfile.profilerevision,
      profileId: "athena",
      profileChangesBaseRevision: newAccountProfile.profilerevision,
      profileChanges: [
        {
          changeType: "statModified",
          name: `favorite_${category.toLowerCase()}`,
          value: itemToSlot,
        },
      ],
      profileCommandRevision: newAccountProfile.profilerevision,
      serverTime: new Date(),
      responseVersion: 2,
    };

    return responseData;
  } catch (error) {
    let err = error as Error;
    log.error(err.message, "EquipBattleRoyaleCustomization");
  }
}
