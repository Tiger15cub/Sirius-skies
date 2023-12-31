import path from "node:path";
import fs from "node:fs";
import log from "../../../../utils/log";
import { AthenaData, SeasonData } from "../../../../interface";
import { AddProfileItem } from "../../utils/profile";
import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";
import { getProfile } from "../../utils/getProfile";

export let level: number = 1;
export let hasPurchasedBP: boolean = false;
export let XP: number = 0;

export default async function Athena(
  User: any,
  Account: any,
  accountId: string,
  profileId: string,
  client: boolean,
  season: number | string,
  rvn: any
): Promise<AthenaData | { errorCode: string; message: string }> {
  try {
    rvn = 0;

    let userProfiles = getProfile(accountId);

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

    if (selectedSeason === season) {
      athena.Season.forEach((e: SeasonData) => {
        if (e.season === selectedSeason) {
          level = e.book_level;
          hasPurchasedBP = e.book_purchased;
          XP = e.book_xp;
        }
      });
    }

    await AddProfileItem(
      athena,
      profileId,
      rvn,
      level,
      XP,
      season,
      hasPurchasedBP
    );

    if (user.hasFL) {
      const athena = require("../../../resources/mcp/AllCosmetics.json");

      userProfiles.profileChanges[0].profile.items = {
        ...userProfiles.profileChanges[0].profile.items,
        ...athena,
      };
    } else {
      const athena = require("../../../resources/mcp/Athena.json");

      userProfiles.profileChanges[0].profile.items = {
        ...userProfiles.profileChanges[0].profile.items,
        ...athena,
      };

      if (client) {
        const defaultAthena = require("../../../resources/mcp/DefaultAthena.json");

        userProfiles.profileChanges[0].profile.items = {
          ...userProfiles.profileChanges[0].profile.items,
          ...defaultAthena,
        };
      }
    }

    const favorites = [
      "favorite_character",
      "favorite_itemwraps",
      "favorite_skydivecontrail",
      "favorite_pickaxe",
      "favorite_glider",
      "favorite_backpack",
      "favorite_dance",
      "favorite_loadingscreen",
      "favorite_musicpack",
    ];

    const lockerSlots = ["sandbox_loadout", "loadout_1"];

    for (const favorite of favorites) {
      if (
        athena[favorite.replace("favorite_", "")]?.items &&
        userProfiles.profileChanges?.[0]?.profile?.stats?.attributes
      ) {
        userProfiles.profileChanges[0].profile.stats.attributes[favorite] =
          athena[favorite.replace("favorite_", "")]?.items;
      }
    }

    for (const slot of lockerSlots) {
      const lockerData = {
        templateId: "CosmeticLocker:cosmeticlocker_athena",
        attributes: {
          locker_slots_data: {
            slots: {
              MusicPack: { items: [athena.musicpack.items] },
              Character: {
                items: [athena.character.items],
                activeVariants: athena.character.activeVariants,
              },
              Backpack: {
                items: [athena.backpack.items],
                activeVariants: [athena.backpack.activeVariants],
              },
              SkyDiveContrail: {
                items: [athena.skydivecontrail.items],
                activeVariants: [athena.skydivecontrail.activeVariants],
              },
              Dance: { items: athena.dance.items },
              LoadingScreen: { items: [athena.loadingscreen.items] },
              Pickaxe: {
                items: [athena.pickaxe.items],
                activeVariants: [athena.pickaxe.activeVariants],
              },
              Glider: {
                items: [athena.glider.items],
                activeVariants: [athena.glider.activeVariants],
              },
              ItemWrap: {
                items: athena.itemwrap.items,
                activeVariants: [athena.itemwrap.activeVariants],
              },
            },
          },
          use_count: 0,
          banner_icon_template: athena.Banner.banner_icon,
          banner_color_template: athena.Banner.banner_color,
          locker_name: "Sirius",
          item_seen: false,
          favorite: false,
        },
        quantity: 1,
      };

      userProfiles.profileChanges[0].profile.items[slot] = lockerData;
    }

    return userProfiles;
  } catch (error) {
    let err: Error = error as Error;
    log.error(`Error in ProfileAthena: ${err.message}`, "ProfileAthena");
    throw error;
  }
}
