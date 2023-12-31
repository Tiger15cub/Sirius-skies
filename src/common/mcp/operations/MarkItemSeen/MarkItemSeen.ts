import { DateTime } from "luxon";
import Accounts from "../../../../models/Accounts";
import { createDefaultResponse, getSeason } from "../../../../utils";
import { getProfile } from "../../utils/getProfile";

export default async function MarkItemSeen(
  profileId: string,
  accountId: string,
  rvn: number,
  req: any
) {
  const userAgent = req.headers["user-agent"];
  let season = getSeason(userAgent);

  const account = await Accounts.findOne({ accountId }).lean();

  if (!account) return { errorMessage: "Failed to find account." };

  const applyProfileChanges: any[] = [];

  const { itemIds } = req.body;

  const items = account.items;

  const userProfiles = getProfile(accountId);

  for (let item in itemIds) {
    userProfiles.profileChanges[0].profile.items[
      itemIds[item]
    ].attributes.item_seen = true;

    applyProfileChanges.push({
      changeType: "itemAttrChanged",
      itemId: itemIds[item],
      attributeName: "item_seen",
      attributeValue: true,
    });
  }

  if (applyProfileChanges.length > 0) {
    rvn += 1;
    account.RVN += 1;
    account.baseRevision += 1;

    Accounts.updateOne(
      { accountId },
      { $set: { RVN: parseInt(account.baseRevision.toString() ?? "0") + 1 } }
    );

    Accounts.updateOne(
      { accountId },
      {
        $set: {
          baseRevision: parseInt(account.baseRevision.toString() ?? "0") + 1,
        },
      }
    );
  }

  if (applyProfileChanges.length > 0) {
    Accounts.updateOne(
      { accountId },
      {
        $set: {
          ["items"]: items,
        },
      }
    );
  }

  return {
    profileRevision: account.profilerevision,
    profileId,
    profileChangesBaseRevision: account.baseRevision,
    profileChanges: applyProfileChanges,
    profileCommandRevision: rvn,
    serverTime: DateTime.now().toISO(),
    responseVersion: 1,
  };
}
