import log from "../../../../utils/log";
import { SeasonData } from "../../../../interface";
import { v4 as uuid } from "uuid";
import { getProfile } from "../../utils/getProfile";
import Accounts from "../../../../models/Accounts";
import { Response } from "express";
import { DateTime } from "luxon";
import AccountRefresh from "../../../../utils/AccountRefresh";

let cachedAthenaCosmetics: any = null;
let cachedBasicAthena: any = null;
let cachedDefaultAthena: any = null;

const loadAndCacheJSONFiles = async () => {
  cachedAthenaCosmetics = require("../../../resources/mcp/AllCosmetics.json");
  cachedBasicAthena = require("../../../resources/mcp/Athena.json");
  cachedDefaultAthena = require("../../../resources/mcp/DefaultAthena.json");
};

loadAndCacheJSONFiles();

export default async function Athena(
  User: any,
  Account: any,
  accountId: string,
  client: boolean,
  season: number | string,
  res: Response
) {
  try {
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

    const userProfiles = await getProfile(accountId);

    const cosmeticToMerge = user.hasFL
      ? cachedAthenaCosmetics
      : client
      ? cachedDefaultAthena
      : cachedBasicAthena;

    userProfiles.items = { ...userProfiles.items, ...cosmeticToMerge };

    userProfiles.stats.attributes.season_num = season as number;

    const applyProfileChanges: any[] = [
      {
        changeType: "fullProfileUpdate",
        _id: uuid(),
        profile: { ...userProfiles },
      },
    ];

    userProfiles.rvn += 1;
    userProfiles.commandRevision += 1;
    userProfiles.Updated = DateTime.now().toISO();

    await athena.updateOne({ $set: { athena: userProfiles } });

    res.json({
      profileRevision: userProfiles.rvn || 0,
      profileId: "athena",
      profileChangesBaseRevision: athena.baseRevision || 0,
      profileChanges: applyProfileChanges,
      profileCommandRevision: userProfiles.commandRevision,
      serverTime: DateTime.now().toISO(),
      responseVersion: 1,
    });
  } catch (error) {
    log.error(`Error in ProfileAthena: ${error}`, "ProfileAthena");
    throw error;
  }
}
