import { Router, Request, Response } from "express";
import Accounts from "../models/Accounts";
import log from "../utils/log";

interface Account {
  accountId: string;
  stats: {
    [key: string]: {
      wins: number;
    };
  };
}

async function getEntries(account: Account[], mode: string): Promise<any[]> {
  const validAccounts = account.filter((acc) => acc.stats && acc.stats[mode]);

  return validAccounts.slice(0, 100).map((acc) => ({
    account: acc.accountId,
    value: acc.stats[mode].wins,
  }));
}

export default function initRoute(router: Router) {
  router.all(
    [
      "/statsproxy/api/statsv2/leaderboards/:type",
      "/fortnite/api/statsv2/leaderboards/:type",
    ],
    async (req: Request, res: Response) => {
      try {
        const { type } = req.params;

        const leaderboardTypeToMode: { [key: string]: string } = {
          br_placetop1_keyboardmouse_m0_playlist_defaultduo: "duos",
          br_placetop1_keyboardmouse_m0_playlist_defaultsquad: "squad",
          default: "solos",
        };

        const mode: string =
          leaderboardTypeToMode[type] || leaderboardTypeToMode.default;

        const accounts = await Accounts.find().lean();

        const entries = await getEntries(accounts, mode);

        res.json({
          entries,
          maxSize: 1000,
        });
      } catch (error) {
        let err: Error = error as Error;
        log.error(`Error getting leaderboard entries: ${err.message}`, "Stats");
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  );
}
