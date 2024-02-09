import { Response, Request } from "express";
import { sendErrorResponse } from "../../../../utils";
import { getCommonCore, getProfile } from "../../utils/getProfile";
import log from "../../../../utils/log";
import { DateTime } from "luxon";
import Accounts from "../../../../models/Accounts";

export default async function RefundMtxPurchase(
  req: Request,
  res: Response,
  accountId: string
) {
  try {
    const { purchaseId } = req.body;

    const userProfiles = await getProfile(accountId);
    const common_core = await getCommonCore(accountId);
    const account = await Accounts.findOne({ accountId });

    if (!account)
      return res.status(404).json({ error: "Failed to find Account." });

    const itemGuids: any[] = [];

    const applyProfileChanges: any[] = [];

    common_core.stats.attributes.mtx_purchase_history.refundsUsed += 1;
    common_core.stats.attributes.mtx_purchase_history.refundCredits -= 1;

    common_core.stats.attributes.mtx_purchase_history.purchases.forEach(
      (purchase: {
        purchaseId: string;
        lootResult: any[];
        refundDate: string;
      }) => {
        if (purchase.purchaseId === purchaseId) {
          purchase.lootResult.forEach(({ itemGuid }) => {
            itemGuids.push(itemGuid);
          });
          purchase.refundDate = DateTime.now().toISO();
        }
      }
    );

    for (const itemId of itemGuids) {
      delete userProfiles.items[itemId];

      applyProfileChanges.push({
        changeType: "itemRemoved",
        itemId,
      });
    }

    if (applyProfileChanges.length > 0) {
      common_core.rvn += 1;
      common_core.commandRevision += 1;
      common_core.Updated = DateTime.now().toISO();

      applyProfileChanges.push({
        changeType: "statModified",
        name: "mtx_purchase_history",
        value: common_core.stats.attributes.mtx_purchase_history,
      });
    }

    res.json({
      profileRevision: common_core.rvn || 0,
      profileId: "athena",
      profileChangesBaseRevision: account.baseRevision || 0,
      profileChanges: applyProfileChanges,
      profileCommandRevision: common_core.baseRevision || 0,
      serverTime: DateTime.now().toISO(),
      responseVersion: 1,
    });
  } catch (error) {
    log.error(`Error in RefundMtxPurchase: ${error}`, "RefundMtxPurchase");
    return res.status(500).json({ error: "Internal server error." });
  }
}
