import fs from "node:fs/promises";
import log from "../../../../utils/log";
import { CommonCoreData, CommonCoreProfile } from "../../../../interface";
import { getDefaultCommonCoreData, mapPurchasesData } from "../../../../utils";
import { getCommonCore } from "../../utils/getProfile";
import { DateTime } from "luxon";
import Accounts, { BanTypes } from "../../../../models/Accounts";
import Users from "../../../../models/Users";

async function checkBanExpiry(accountId: string) {
  const expiredBans = await Accounts.findOne({
    accountId,
    "common_core.stats.attributes.ban_status.bBanHasStarted": true,
    "common_core.stats.attributes.ban_status.banStartTimeUtc": {
      // need a good way of checking the ban start time
      $lte: DateTime.now().toISO(),
    },
  });

  if (expiredBans) {
    const banStartTime = DateTime.fromISO(
      expiredBans.common_core.stats.attributes.ban_status.banStartTimeUtc
    );
    const banDurationDays =
      expiredBans.common_core.stats.attributes.ban_status.banDurationDays;

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
  simpleProfile?: boolean,
  locals?: any
): Promise<CommonCoreProfile | CommonCoreData> {
  try {
    await checkBanExpiry(accountId);

    let [account, user] = await Promise.all([
      Account.findOne({ accountId }).lean(),
      Users.findOne({ accountId }).lean(),
    ]);

    const common_core = await getCommonCore(accountId);

    if (!account || !user) {
      return simpleProfile
        ? getDefaultCommonCoreData(profileId)
        : getDefaultCommonCoreData(profileId);
    }

    if (!account.baseRevision) {
      await Account.updateOne(
        { accountId },
        { baseRevision: account.profilerevision - 1 }
      );
      account = await Account.findOne({ accountId }).lean().exec();
    }

    common_core.stats.attributes.survey_data = {};
    common_core.stats.attributes.personal_offers = {};
    common_core.stats.attributes.intro_game_played = true;
    common_core.stats.attributes.import_friends_claimed = {};
    common_core.stats.attributes.mtx_purchase_history.refundsUsed = 0;
    common_core.stats.attributes.mtx_purchase_history.refundCredits = 3;
    common_core.stats.attributes.mtx_purchase_history.purchases = [];
    common_core.stats.attributes.undo_cooldowns = [];
    common_core.stats.attributes.mtx_affiliate_set_time = "";
    common_core.stats.attributes.inventory_limit_bonus = 0;
    common_core.stats.attributes.current_mtx_platform = "EpicPC";
    common_core.stats.attributes.mtx_affiliate = "";
    common_core.stats.attributes.forced_intro_played = "Coconut";
    common_core.stats.attributes.weekly_purchases = {};
    common_core.stats.attributes.daily_purchases = {};
    common_core.stats.attributes.ban_history = {};
    common_core.stats.attributes.in_app_purchases = {};
    common_core.stats.attributes.permissions = [];
    common_core.stats.attributes.undo_timeout = "min";
    common_core.stats.attributes.monthly_purchases = {};
    common_core.stats.attributes.gift_history = {};

    if (
      !common_core.stats.attributes.ban_status &&
      common_core.stats.attributes.ban_status === undefined
    ) {
      common_core.stats.attributes.ban_status = {
        bRequiresUserAck: false,
        banReasons: [],
        bBanHasStarted: false,
        banStartTimeUtc: "2024-01-23T17:59:20.387-07:00",
        banDurationDays: 0,
        additionalInfo: "",
        exploitProgramName: "",
        competitiveBanReason: "None",
      };
    }

    const applyProfileChanges: any[] = [];

    applyProfileChanges.push({
      changeType: "fullProfileUpdate",
      _id: "RANDOM",
      profile: {
        ...common_core,
      },
    });

    const commonCoreData: CommonCoreData = {
      profileRevision: account.profilerevision || 0,
      profileId,
      profileChangesBaseRevision: account.BaseRevision || 0,
      profileChanges: applyProfileChanges,
      serverTime: new Date().toISOString(),
      profileCommandRevision: account.profilerevision,
      responseVersion: 1,
    };

    const commonCore = require("../../../resources/mcp/Common_Core.json");
    commonCoreData.profileChanges[0].profile.items = {
      ...commonCoreData.profileChanges[0].profile.items,
      ...commonCore,
    };

    if (simpleProfile) return commonCoreData.profileChanges[0].profile;
    await Account.updateOne(
      { accountId },
      { $set: { common_core: common_core } }
    );

    return commonCoreData;
  } catch (error) {
    let err: Error = error as Error;
    log.error(
      `Error in ProfileCommonCore: ${err.message}`,
      "ProfileCommonCore"
    );
    throw error;
  }
}
