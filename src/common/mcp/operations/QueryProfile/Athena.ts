import log from "../../../../utils/log";
import { SeasonData } from "../../../../interface";
import { v4 as uuid } from "uuid";
import { getProfile } from "../../utils/getProfile";
import Accounts from "../../../../models/Accounts";
import { Response } from "express";
import { DateTime } from "luxon";
import AccountRefresh from "../../../../utils/AccountRefresh";

const athenaCosmetics = require("../../../resources/mcp/AllCosmetics.json");
const basicAthena = require("../../../resources/mcp/Athena.json");
const defaultAthena = require("../../../resources/mcp/DefaultAthena.json");

export default async function Athena(
  User: any,
  Account: any,
  accountId: string,
  profileId: string,
  client: boolean,
  season: number | string,
  rvn: any,
  res: Response
) {
  try {
    rvn = 0;

    const [athena, user] = await Promise.all([
      Account.findOne({ accountId }),
      User.findOne({ accountId }),
    ]);

    if (!athena || !user) {
      return res.status(404).json({
        errorCode:
          "errors.com.sirius.backend.common.mcp.account_or_user.not_found",
        message: "Account or User not found.",
      });
    }

    await athena.updateOne({ ["Season.0.seasonNumber"]: season as number });

    const selectedSeason: string | number = season;
    let level: number = 1;
    let hasPurchasedBP: boolean = false;
    let XP: number = 0;

    if (selectedSeason === season) {
      athena.Season.map((e: SeasonData) => {
        if (e.season === selectedSeason) {
          level = e.book_level;
          hasPurchasedBP = e.book_purchased;
          XP = e.book_xp;
        }
        return e;
      });
    }

    const userProfiles = await getProfile(accountId);
    const cosmeticToMerge = user.hasFL
      ? athenaCosmetics
      : client
      ? defaultAthena
      : basicAthena;

    userProfiles.items = Object.assign({}, userProfiles.items, cosmeticToMerge);

    userProfiles.stats.attributes.season_num = season as number;
    userProfiles.stats.attributes.accountLevel = level;
    userProfiles.stats.attributes.level = level;
    userProfiles.stats.attributes.xp = XP;
    userProfiles.stats.attributes.book_purchased = hasPurchasedBP;

    const applyProfileChanges = [
      {
        changeType: "fullProfileUpdate",
        _id: uuid(),
        profile: { ...userProfiles },
      },
    ];

    userProfiles.rvn += 1;
    userProfiles.commandRevision += 1;
    userProfiles.Updated = DateTime.now().toISO();

    res.json({
      profileRevision: userProfiles.rvn || 0,
      profileId: "athena",
      profileChangesBaseRevision: athena.baseRevision || 0,
      profileChanges: applyProfileChanges,
      profileCommandRevision: userProfiles.commandRevision,
      serverTime: DateTime.now().toISO(),
      responseVersion: 1,
    });

    if (applyProfileChanges.length > 0) {
      await athena.updateOne({ $set: { athena: userProfiles } });
    }
  } catch (error) {
    log.error(`Error in ProfileAthena: ${error}`, "ProfileAthena");
    throw error;
  }
}
