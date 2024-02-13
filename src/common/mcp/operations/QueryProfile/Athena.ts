import log from "../../../../utils/log";
import { v4 as uuid } from "uuid";
import { getProfile } from "../../utils/getProfile";
import Accounts from "../../../../models/Accounts";
import { Response } from "express";
import { DateTime } from "luxon";

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
      Account.findOne({ accountId }).cacheQuery(),
      User.findOne({ accountId }).cacheQuery(),
    ]);

    if (!athena || !user) {
      return Promise.reject({
        status: 404,
        message: "Account or User not found.",
      });
    }

    const [userProfiles] = await Promise.all([getProfile(accountId)]);

    const cosmeticToMerge = user.hasFL
      ? cachedAthenaCosmetics
      : client
      ? cachedDefaultAthena
      : cachedBasicAthena;

    userProfiles.items = { ...userProfiles.items, ...cosmeticToMerge };
    userProfiles.stats.attributes.season_num = season as number;

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

    await athena.updateOne({ $set: { athena: userProfiles } }).cacheQuery();

    return Promise.resolve({
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
    return Promise.reject({
      status: 500,
      message: "Internal server error",
    });
  }
}
