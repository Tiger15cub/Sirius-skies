import { Router, Request, Response } from "express";
import Accounts from "../models/Accounts";
import log from "../utils/log";

export default function initRoute(router: Router) {
  router.get("/statsproxy/api/statsv2/query", (req, res) => {
    const { collection_fish, collection_character } = req.query;
  });

  router.get(
    "/statsproxy/api/statsv2/leaderboards/:leaderboardName",
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
