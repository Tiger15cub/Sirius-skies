import { Response, Request } from "express";
import { getCommonCore, getProfile } from "../../utils/getProfile";
import log from "../../../../utils/log";
import { DateTime } from "luxon";
import Accounts from "../../../../models/Accounts";

export default async function SetAffiliateName(
  req: Request,
  res: Response,
  accountId: string,
  username: string
) {
  try {
    const { affiliateName } = req.body;

    const common_core = await getCommonCore(accountId);
    const account = await Accounts.findOne({ accountId }).cacheQuery();

    const applyProfileChanges: any[] = [];

    if (!account)
      return res.status(404).json({ error: "Failed to find Account." });

    if (affiliateName === username) {
      common_core.stats.attributes.mtx_affiliate = affiliateName;
      common_core.stats.attributes.mtx_affiliate_set_time =
        DateTime.now().toISO();
    }

    applyProfileChanges.push({
      changeType: "statModified",
      name: "mtx_affiliate",
      value: common_core.stats.attributes.mtx_affiliate,
    });

    applyProfileChanges.push({
      changeType: "statModified",
      name: "mtx_affiliate_set_time",
      value: common_core.stats.attributes.mtx_affiliate_set_time,
    });

    res.json({
      profileRevision: common_core.rvn || 0,
      profileId: "common_core",
      profileChangesBaseRevision: account.baseRevision || 0,
      profileChanges: applyProfileChanges,
      profileCommandRevision: common_core.baseRevision || 0,
      serverTime: DateTime.now().toISO(),
      responseVersion: 1,
    });

    if (applyProfileChanges.length > 0) {
      common_core.rvn += 1;
      common_core.commandRevision += 1;
      common_core.Updated = DateTime.now().toISO();

      await account.updateOne({ $set: { common_core } }).cacheQuery();
    }
  } catch (error) {
    log.error(`Error in SetAffiliateName: ${error}`, "SetAffiliateName");
    return res.status(500).json({ error: "Internal server error." });
  }
}
