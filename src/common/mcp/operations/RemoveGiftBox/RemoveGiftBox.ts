import { Response, Request } from "express";
import { sendErrorResponse } from "../../../../utils";
import { getCommonCore, getProfile } from "../../utils/getProfile";
import log from "../../../../utils/log";
import { DateTime } from "luxon";
import Accounts from "../../../../models/Accounts";

export default async function RemoveGiftBox(
  req: Request,
  res: Response,
  accountId: string,
  profileId: string
) {
  try {
    const { giftBoxItemId, giftBoxItemIds } = req.body;

    if (!giftBoxItemId && !giftBoxItemIds) {
      return res.status(400).json({ error: "No GiftBox item id provided." });
    }

    const common_core = await getCommonCore(accountId);
    const account = await Accounts.findOne({ accountId });

    if (!account) {
      return res.status(404).json({ error: "Account not found." });
    }

    const applyProfileChanges: any[] = [];

    if (giftBoxItemId && typeof giftBoxItemId === "string") {
      delete common_core.items[giftBoxItemId];

      applyProfileChanges.push({
        changeType: "itemRemoved",
        itemId: giftBoxItemId,
      });
    }

    if (giftBoxItemIds && Array.isArray(giftBoxItemIds)) {
      giftBoxItemIds.forEach((itemId) => {
        delete common_core.items[itemId];

        applyProfileChanges.push({
          changeType: "itemRemoved",
          itemId,
        });
      });
    }

    if (applyProfileChanges.length > 0) {
      common_core.rvn += 1;
      common_core.commandRevision += 1;
      common_core.Updated = DateTime.now().toISO();
    }

    res.json({
      profileRevision: common_core.rvn || 0,
      profileId,
      profileChangesBaseRevision: account.baseRevision || 0,
      profileChanges: applyProfileChanges,
      profileCommandRevision: common_core.baseRevision || 0,
      serverTime: DateTime.now().toISO(),
      responseVersion: 1,
    });

    if (applyProfileChanges.length > 0) {
      await account.updateOne({ common_core }).cacheQuery();
    }
  } catch (error) {
    log.error(`Error in RemoveGiftBox: ${error}`, "RemoveGiftBox");
    return res.status(500).json({ error: "Internal server error." });
  }
}
