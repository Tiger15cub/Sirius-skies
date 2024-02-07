import { DateTime } from "luxon";
import { Request, Response } from "express";
import Accounts from "../../../../models/Accounts";
import Users from "../../../../models/Users";
import { getCommonCore } from "../../utils/getProfile";
import log from "../../../../utils/log";
import CommonCoreData from "../../../resources/mcp/Common_Core.json";
import { BanStatus } from "../../../../interface";

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
      );
    }
  }
}

export default async function ProfileCommonCore(
  Account: any,
  accountId: string,
  profileId: string,
  res: Response,
  req: Request
): Promise<void> {
  try {
    await checkBanExpiry(accountId);

    const [account, user] = await Promise.all([
      Account.findOne({ accountId }).lean(),
      Users.findOne({ accountId }).lean(),
    ]);

    let common_core = await getCommonCore(accountId);

    if (!account || !user) {
      common_core.stats.attributes.survey_data = {};
    }

    common_core.stats.attributes = {
      survey_data: {},
      personal_offers: {},
      intro_game_played: true,
      import_friends_claimed: {},
      mtx_purchase_history: {
        refundsUsed: 0,
        refundCredits: 3,
        purchases: [],
      },
      undo_cooldowns: [],
      mtx_affiliate_set_time: "",
      inventory_limit_bonus: 0,
      current_mtx_platform: "EpicPC",
      mtx_affiliate: "",
      forced_intro_played: "Coconut",
      weekly_purchases: {},
      daily_purchases: {},
      ban_history: {},
      in_app_purchases: {},
      permissions: [],
      undo_timeout: "min",
      monthly_purchases: {},
      gift_history: {},
      ban_status: common_core.stats.attributes.ban_status || DEFAULT_BAN_STATUS,
    };

    const applyProfileChanges = [
      {
        changeType: "fullProfileUpdate",
        _id: "RANDOM",
        profile: { ...common_core },
      },
    ];

    common_core.items = {
      ...common_core.items,
      CommonCoreData,
    };

    await Account.updateOne({ accountId }, { $set: { common_core } });

    res.json({
      profileRevision: account.profilerevision || 0,
      profileId: "common_core",
      profileChangesBaseRevision: account.BaseRevision || 0,
      profileChanges: applyProfileChanges,
      serverTime: DateTime.now().toISO(),
      profileCommandRevision: account.profilerevision,
      responseVersion: 1,
    });
  } catch (error) {
    log.error(`Error in ProfileCommonCore: ${error}`, "ProfileCommonCore");
    throw error;
  }
}
