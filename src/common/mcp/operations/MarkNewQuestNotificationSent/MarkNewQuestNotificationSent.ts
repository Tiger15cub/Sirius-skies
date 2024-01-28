import { Request, Response } from "express";
import { getProfile } from "../../utils/getProfile";
import Accounts from "../../../../models/Accounts";
import { sendErrorResponse } from "../../../../utils";
import { DateTime } from "luxon";

export default async function MarkNewQuestNotificationSent(
  res: Response,
  req: Request,
  accountId: string,
  profileId: string
) {
  const userProfiles: any = await getProfile(accountId);
  const account = await Accounts.findOne({ accountId });
  const applyProfileChanges: any[] = [];

  const { itemIds } = req.body;

  if (!account) {
    return res.status(404).json({ error: "Failed to find Account." });
  }

  if (itemIds.length > 100)
    return res
      .status(400)
      .json({ error: "itemId length must be 100 or less characters." });

  for (const item in itemIds) {
    const itemId = itemIds[item];

    userProfiles.items[itemId].attributes.sent_new_notification = true;

    applyProfileChanges.push({
      changeType: "itemAttrChanged",
      itemId,
      attributeName: "sent_new_notification",
      attributeValue: true,
    });
  }

  if (applyProfileChanges.length > 0) {
    userProfiles.rvn += 1;
    userProfiles.commandRevision += 1;
    userProfiles.Update = DateTime.now().toISO();
  }

  res.json({
    profileRevision: userProfiles.rvn || 0,
    profileId: profileId || "athena",
    profileChangesBaseRevision: account.baseRevision || 0,
    profileChanges: applyProfileChanges,
    profileCommandRevision: userProfiles.commandRevision || 0,
    serverTime: DateTime.now().toISO(),
    responseVersion: 1,
  });

  if (applyProfileChanges.length > 0) {
    await account.updateOne({ $set: { athena: userProfiles } });
  }
}
