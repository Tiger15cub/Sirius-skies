import { Router, Request, Response } from "express";
import Accounts from "../models/Accounts";
import log from "../utils/log";
import verifyToken from "../middleware/verifyToken";

export default function initRoute(router: Router) {
  router.all(
    ["/statsproxy/api/statsv2/query", "/fortnite/api/statsv2/query"],
    verifyToken,
    async (req: Request, res: Response) => {
      // https://github.com/LeleDerGrasshalmi/FortniteEndpointsDocumentation/blob/60127cdbc8aad6fd029b2f486509718bf89d149d/EpicGames/StatsProxyService/Stats/UserStats.md
      const { collection } = req.query;
      const { appId, startDate, endDate, owners, stats } = req.body;

      const account = await Accounts.findOne().lean();

      if (!account) {
        return res.status(404).json({ error: "Account does not exist." });
      }

      if (collection) {
        const collectionResponse = [
          {
            startTime: 0,
            endTime: 9223372036854775807,
            stats: {
              br_collection_fish_gas_purple_length_s16: 51421,
              br_collection_fish_zeropoint_tidal_length_s21: 77466,
              br_collection_fish_jellyfish_purple_length_s17: 46166,
              br_collection_fish_lesseffectiveflopper_blue_length_s17: 18923,
              br_collection_fish_jellyfish_pink_length_s19: 47579,
              br_collection_fish_flameyfish_black_length_s16: 53010,
              br_collection_fish_rift_volcanic_length_s15: 62649,
              br_collection_fish_flameyfish_black_length_s17: 39315,
              br_collection_fish_flopper_blue_length_s19: 47376,
              "br_collection_fish_shieldfish.lightblue__length_s20": 41965,
            },
            accountId: account.accountId,
          },
        ];
        res.json(collectionResponse);
      } else {
        const statsResponse = [
          {
            startTime: 0,
            endTime: 9223372036854775807,
            stats: {
              s23_social_bp_level: 2274,
            },
            accountId: account.accountId,
          },
        ];
        res.json(statsResponse);
      }
    }
  );

  router.get(
    "/statsproxy/api/statsv2/leaderboards/:leaderboardName",
    verifyToken,
    async (req, res) => {
      const { leaderboardName } = req.params;

      const leaderboardTypeToMode: { [key: string]: string } = {
        br_placetop1_keyboardmouse_m0_playlist_defaultduo: "duos",
        br_placetop1_keyboardmouse_m0_playlist_defaultsquad: "squad",
        br_placetop1_keyboardmouse_m0_playlist_defaultsolo: "solos",
        default: "solos",
      };

      const mode =
        leaderboardTypeToMode[leaderboardName] || leaderboardTypeToMode.default;

      const account = await Accounts.findOne().lean();
      const entries: any[] = [];

      if (!account) {
        return res.status(404).json({
          error: "Failed to find account(s)",
        });
      } else {
        entries.push({
          account: account.accountId,
          // @ts-ignore
          value: account.stats[mode].wins,
        });
      }

      res.json({
        entries,
        maxSize: 1000,
      });
    }
  );

  router.all(
    [
      "/statsproxy/api/statsv2/account/:accountId",
      "/fortnite/api/statsv2/account/:accountId",
    ],
    verifyToken,
    async (req: Request, res: Response) => {
      try {
        const { accountId } = req.params;
        const { startTime, endTime } = req.query;

        const account = await Accounts.findOne({ accountId }).lean();

        if (!account) {
          return res.status(404).json({
            error: "Failed to find account.",
          });
        }

        res.json({
          startTime,
          endTime,
          stats: {
            br_score_keyboardmouse_m0_playlist_DefaultSolo: 859,
            br_kills_keyboardmouse_m0_playlist_DefaultSolo:
              account.stats.solos.kills,
            br_playersoutlived_keyboardmouse_m0_playlist_DefaultSolo: 0,
            br_matchesplayed_keyboardmouse_m0_playlist_DefaultSolo:
              account.stats.solos.matchplayed,
            br_placetop25_keyboardmouse_m0_playlist_DefaultSolo: 0,
            br_placetop1_keyboardmouse_m0_playlist_DefaultSolo:
              account.stats.solos.wins,

            br_score_keyboardmouse_m0_playlist_DefaultDuo: 0,
            br_kills_keyboardmouse_m0_playlist_DefaultDuo:
              account.stats.duos.kills,
            br_playersoutlived_keyboardmouse_m0_playlist_DefaultDuo: 0,
            br_matchesplayed_keyboardmouse_m0_playlist_DefaultDuo:
              account.stats.duos.matchplayed,
            br_placetop25_keyboardmouse_m0_playlist_DefaultDuo: 0,
            br_placetop1_keyboardmouse_m0_playlist_DefaultDuo:
              account.stats.duos.wins,

            br_score_keyboardmouse_m0_playlist_DefaultSquad: 0,
            br_kills_keyboardmouse_m0_playlist_DefaultSquad:
              account.stats.squad.kills,
            br_playersoutlived_keyboardmouse_m0_playlist_DefaultSquad: 0,
            br_matchesplayed_keyboardmouse_m0_playlist_DefaultSquad:
              account.stats.squad.matchplayed,
            br_placetop25_keyboardmouse_m0_playlist_DefaultSquad: 0,
            br_placetop1_keyboardmouse_m0_playlist_DefaultSquad:
              account.stats.squad.wins,

            br_score_keyboardmouse_m0_playlist_50v50: 0,
            br_kills_keyboardmouse_m0_playlist_50v50: account.stats.ltm.kills,
            br_playersoutlived_keyboardmouse_m0_playlist_50v50: 0,
            br_matchesplayed_keyboardmouse_m0_playlist_50v50:
              account.stats.ltm.matchplayed,
            br_placetop25_keyboardmouse_m0_playlist_50v50: 0,
            br_placetop1_keyboardmouse_m0_playlist_50v50:
              account.stats.ltm.wins,
          },
          maxSize: 1000,
          accountId: account.accountId,
        });
      } catch (error) {
        let err: Error = error as Error;
        log.error(`Error getting leaderboard entries: ${err.message}`, "Stats");
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  );
}
