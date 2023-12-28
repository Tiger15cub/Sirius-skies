import fs from "node:fs";
import log from "../../../../utils/log";
import { AthenaData, SeasonData } from "../../../../interface";
import { isEqual } from "../../../../utils/isEqual";

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

    let level: number = 1;
    let hasPurchasedBP: boolean = false;
    let XP: number = 0;
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

    const AthenaData: AthenaData = {
      profileRevision: athena.profilerevision || 0,
      profileId,
      profileChangesBaseRevision: rvn || 0,
      profileChanges: [
        {
          changeType: "fullProfileUpdate",
          _id: "RANDOM",
          profile: {
            _id: "RANDOM",
            Update: "",
            Created: "2021-03-07T16:33:28.462Z",
            updated: "2021-05-20T14:57:29.907Z",
            rvn,
            wipeNumber: 1,
            accountId: athena.accountId,
            profileId,
            version: "no_version",
            items: {
              sandbox_loadout: {
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
                  locker_name: "",
                  item_seen: false,
                  favorite: false,
                },
                quantity: 1,
              },
              loadout_1: {
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
              },
              "AthenaPickaxe:DefaultPickaxe": {
                attributes: {
                  favorite: false,
                  item_seen: true,
                  level: 0,
                  max_level_bonus: 0,
                  rnd_sel_cnt: 0,
                  variants: [],
                  xp: 0,
                },
                templateId: "AthenaPickaxe:DefaultPickaxe",
              },
              "AthenaGlider:DefaultGlider": {
                attributes: {
                  favorite: false,
                  item_seen: true,
                  level: 0,
                  max_level_bonus: 0,
                  rnd_sel_cnt: 0,
                  variants: [],
                  xp: 0,
                },
                templateId: "AthenaGlider:DefaultGlider",
              },
              "AthenaDance:EID_DanceMoves": {
                attributes: {
                  favorite: false,
                  item_seen: true,
                  level: 0,
                  max_level_bonus: 0,
                  rnd_sel_cnt: 0,
                  variants: [],
                  xp: 0,
                },
                templateId: "AthenaDance:EID_DanceMoves",
              },
            },
            stats: {
              attributes: {
                use_random_loadout: false,
                past_seasons: [],
                season_match_boost: 0,
                loadouts: ["sandbox_loadout", "loadout_1"],
                mfa_reward_claimed: true,
                rested_xp_overflow: 0,
                current_mtx_platform: "Epic",
                last_xp_interaction: "2022-12-10T22:14:37.647Z",
                quest_manager: {
                  dailyLoginInterval: "0001-01-01T00:00:00.000Z",
                  dailyQuestRerolls: 1,
                },
                book_level: level,
                season_num: season,
                book_xp: XP,
                creative_dynamic_xp: {},
                season: {
                  numWins: 0,
                  numHighBracket: 0,
                  numLowBracket: 0,
                },
                vote_data: {},
                lifetime_wins: 0,
                book_purchased: hasPurchasedBP,
                rested_xp_exchange: 1,
                level,
                rested_xp: 2500,
                rested_xp_mult: 4.4,
                accountLevel: 1,
                rested_xp_cumulative: 52500,
                xp: XP,
                season_friend_match_boost: 0,
                active_loadout_index: 0,
                purchased_bp_offers: [],
                last_match_end_datetime: "",
                mtx_purchase_history_copy: [],
                last_applied_loadout: "sandbox_loadout",
                favorite_musicpack: athena.musicpack.items,
                banner_icon: athena.Banner.banner_icon,
                favorite_character: athena.character.items,
                favorite_itemwraps: athena.itemwrap.items,
                favorite_skydivecontrail: athena.skydivecontrail.items,
                favorite_pickaxe: athena.pickaxe.items,
                favorite_glider: athena.glider.items,
                favorite_backpack: athena.backpack.items,
                favorite_dance: athena.dance.items,
                favorite_loadingscreen: athena.loadingscreen.items,
                banner_color: athena.Banner.banner_color,
              },
            },
            commandRevision: 5,
          },
        },
      ],
      serverTime: new Date().toISOString(),
      profileCommandRevision: athena.profilerevision || 0,
      responseVersion: 1,
    };

    fs.writeFileSync(`${__dirname}/athena.json`, JSON.stringify(AthenaData));

    if (user.hasFL) {
      const athena = require("../../../resources/mcp/AllCosmetics.json");
      AthenaData.profileChanges[0].profile.items = {
        ...AthenaData.profileChanges[0].profile.items,
        ...athena,
      };
    } else {
      const athena = require("../../../resources/mcp/Athena.json");
      let isEnabled: boolean = false;

      AthenaData.profileChanges[0].profile.items = {
        ...AthenaData.profileChanges[0].profile.items,
        ...athena,
      };

      const account = await Account.findOne({ accountId }).lean();

      if (!account.items) {
        await Account.updateOne(
          { accountId },
          {
            $set: {
              ["items"]: [],
            },
          }
        );
      } else {
        isEnabled = account.items.some((cosmetic: any) => true);
      }

      if (isEnabled) {
        await Account.updateOne({ accountId }, { items: account.items }).lean();

        account.items.forEach((cosmetic: any) => {
          fs.writeFileSync(
            `${__dirname}/items.json`,
            JSON.stringify({
              [`${cosmetic.templateId}`]: {
                atrributes: cosmetic.attributes,
                templateId: cosmetic.templateId,
              },
            })
          );

          const items = require("./items.json");

          AthenaData.profileChanges[0].profile.items = {
            ...AthenaData.profileChanges[0].profile.items,
            ...items,
          };
        });
      }

      if (client) {
        const defaultAthena = require("../../../resources/mcp/DefaultAthena.json");

        AthenaData.profileChanges[0].profile.items = {
          ...AthenaData.profileChanges[0].profile.items,
          ...defaultAthena,
        };
      }
    }

    return AthenaData;
  } catch (error) {
    let err: Error = error as Error;
    log.error(`Error in ProfileAthena: ${err.message}`, "ProfileAthena");
    throw error;
  }
}
