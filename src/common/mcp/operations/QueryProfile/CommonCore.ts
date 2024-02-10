import { DateTime } from "luxon";
import { Request, Response } from "express";
import Accounts from "../../../../models/Accounts";
import Users from "../../../../models/Users";
import { getCommonCore } from "../../utils/getProfile";
import log from "../../../../utils/log";
import CommonCoreData from "../../../resources/mcp/Common_Core.json";
import { BanStatus } from "../../../../interface";
import { getSeason } from "../../../../utils";

const DEFAULT_BAN_STATUS: BanStatus = {
  bRequiresUserAck: false,
  banReasons: [],
  bBanHasStarted: false,
  banStartTimeUtc: "2024-01-23T17:59:20.387-07:00",
  banDurationDays: 0,
  additionalInfo: "",
  exploitProgramName: "",
  competitiveBanReason: "None",
};

async function checkBanExpiry(accountId: string): Promise<void> {
  try {
    const expiredBans = await Accounts.findOne({
      accountId,
      "common_core.stats.attributes.ban_status.bBanHasStarted": true,
      "common_core.stats.attributes.ban_status.banStartTimeUtc": {
        $lte: DateTime.now().toISO(),
      },
    });

    if (expiredBans) {
      const { banStartTimeUtc, banDurationDays } =
        expiredBans.common_core.stats.attributes.ban_status;
      const banStartTime = DateTime.fromISO(banStartTimeUtc);
      const banExpiryTime = banStartTime.plus({ days: banDurationDays });

      if (banExpiryTime <= DateTime.now()) {
        await Accounts.updateOne(
          { accountId: expiredBans.accountId },
          {
            $set: {
              "common_core.stats.attributes.ban_status.bRequiresUserAck": false,
              "common_core.stats.attributes.ban_status.bBanHasStarted": false,
            },
          }
        ).cacheQuery();
      }
    }
  } catch (error) {
    log.error(`Error in checkBanExpiry: ${error}`, "CommonCore");
    throw error;
  }
}

export default async function ProfileCommonCore(
  Account: any,
  accountId: string,
  profileId: string,
  res: Response,
  req: Request
) {
  try {
    await checkBanExpiry(accountId);

    const [account, user] = await Promise.all([
      Account.findOne({ accountId }).cacheQuery(),
      Users.findOne({ accountId }).cacheQuery(),
    ]);

    const applyProfileChanges: any[] = [];
    const common_core = await getCommonCore(accountId);

    getSeason(req.headers["user-agent"]);

    if (!account || !user)
      return res.status(404).json({ error: "Failed to find User." });

    common_core.items = {
      ...common_core.items,
      CommonCoreData,
    };

    applyProfileChanges.push({
      changeType: "fullProfileUpdate",
      _id: "RANDOM",
      profile: { ...common_core },
    });

    if (applyProfileChanges.length > 0) {
      common_core.rvn += 1;
      common_core.commandRevision += 1;
      common_core.Updated = DateTime.now().toISO();
    }

    res.json({
      profileRevision: common_core.rvn || 0,
      profileId: "common_core",
      profileChangesBaseRevision: account.BaseRevision || 0,
      profileChanges: applyProfileChanges,
      serverTime: DateTime.now().toISO(),
      profileCommandRevision: common_core.commandRevision,
      responseVersion: 1,
    });

    if (applyProfileChanges.length > 0) {
      await account.updateOne({ $set: { common_core } }).cacheQuery();
    }
  } catch (error) {
    log.error(`Error in ProfileCommonCore: ${error}`, "CommonCore");
    throw error;
  }
}
