import log from "../../../../utils/log";
import { SeasonData } from "../../../../interface";
import { v4 as uuid } from "uuid";
import { getProfile } from "../../utils/getProfile";
import Accounts from "../../../../models/Accounts";

export default async function Athena(
  User: any,
  Account: any,
  accountId: string,
  profileId: string,
  client: boolean,
  season: number | string,
  rvn: any
) {
  try {
    rvn = 0;

    const [athena, user] = await Promise.all([
      Account.findOne({ accountId }).lean(),
      User.findOne({ accountId }).lean(),
    ]);

    if (!athena || !user) {
      return {
        errorCode:
          "errors.com.sirius.backend.common.mcp.account_or_user.not_found",
        message: "Account or User not found.",
      };
    }

    const initializeField = async (field: string, defaultValue: any) => {
      if (athena[field] === undefined) {
        await Account.updateOne({ accountId }, { [field]: defaultValue });

        const updatedProfile = await Account.findOne({ accountId }).lean();

        if (updatedProfile) {
          athena[field] = updatedProfile[field];
        }
      }
    };

    await Promise.all([
      initializeField("Season", [
        {
          seasonNumber: season,
          book_level: 1,
          book_xp: 0,
          book_purchased: false,
        },
      ]),
      initializeField("stats", {
        solos: { wins: 0, kills: 0, matchplayed: 0 },
        duos: { wins: 0, kills: 0, matchplayed: 0 },
        squad: { wins: 0, kills: 0, matchplayed: 0 },
        ltm: { wins: 0, kills: 0, matchplayed: 0 },
      }),
      initializeField("baseRevision", athena.profilerevision - 1),
    ]);

    await Account.updateOne(
      { accountId },
      { ["Season.0.seasonNumber"]: season as number }
    );

    const selectedSeason: string | number = season;
    let level: number = 1;
    let hasPurchasedBP: boolean = false;
    let XP: number = 0;

    if (selectedSeason === season) {
      athena.Season.forEach((e: SeasonData) => {
        if (e.season === selectedSeason) {
          level = e.book_level;
          hasPurchasedBP = e.book_purchased;
          XP = e.book_xp;
        }
      });
    }

    const userProfiles = await getProfile(accountId);

    if (user.hasFL) {
      const athena = require("../../../resources/mcp/AllCosmetics.json");

      userProfiles.items = {
        ...userProfiles.items,
        ...athena,
      };
    } else {
      const athena = require("../../../resources/mcp/Athena.json");

      userProfiles.items = {
        ...userProfiles.items,
        ...athena,
      };

      if (client) {
        const defaultAthena = require("../../../resources/mcp/DefaultAthena.json");

        userProfiles.items = {
          ...userProfiles.items,
          ...defaultAthena,
        };
      }
    }

    userProfiles.stats.attributes.season_num = season as number;

    await Accounts.updateOne(
      { accountId },
      {
        $set: {
          athena: userProfiles,
        },
      }
    );

    return {
      profileRevision: userProfiles.rvn || 0,
      profileId: "athena",
      profileChangesBaseRevision: athena.baseRevision || 0,
      profileChanges: [
        {
          changeType: "fullProfileUpdate",
          _id: uuid(),
          profile: {
            ...userProfiles,
          },
        },
      ],
    };
  } catch (error) {
    let err: Error = error as Error;
    log.error(`Error in ProfileAthena: ${err.message}`, "ProfileAthena");
    throw error;
  }
}
