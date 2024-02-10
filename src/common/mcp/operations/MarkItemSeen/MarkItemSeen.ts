import { DateTime } from "luxon";
import Accounts from "../../../../models/Accounts";
import { createDefaultResponse, getSeason } from "../../../../utils";
import { getProfile } from "../../utils/getProfile";
import fs from "node:fs/promises";
import path from "node:path";
import { Response, Request } from "express";

export default async function MarkItemSeen(
  profileId: string,
  accountId: string,
  rvn: number,
  res: Response,
  req: Request
) {
  const userAgent = req.headers["user-agent"];

  const account = await Accounts.findOne({ accountId }).cacheQuery();

  if (!account) return { errorMessage: "Failed to find account." };

  const applyProfileChanges: any[] = [];

  const { itemIds } = req.body;

  const userProfiles: any = await getProfile(accountId);

  for (let item in itemIds) {
    const itemId = itemIds[item];

    userProfiles.items[itemId].attributes.item_seen = true;

    applyProfileChanges.push({
      changeType: "itemAttrChanged",
      itemId: itemId,
      attributeName: "item_seen",
      attributeValue: true,
    });
  }

  if (applyProfileChanges.length > 0) {
    rvn += 1;
    userProfiles.rvn += 1;
    userProfiles.commandRevision += 1;
    userProfiles.Updated = DateTime.utc().toISO();
  }

  res.json({
    profileRevision: userProfiles.rvn || 0,
    profileId,
    profileChangesBaseRevision: account.baseRevision,
    profileChanges: applyProfileChanges,
    profileCommandRevision: userProfiles.commandRevision,
    serverTime: DateTime.now().toISO(),
    responseVersion: 1,
  });

  if (applyProfileChanges.length > 0) {
    await account
      .updateOne(
        { accountId },
        {
          $set: {
            athena: userProfiles,
          },
        }
      )
      .cacheQuery();
  }
}
