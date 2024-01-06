import { Router } from "express";
import { getSeason } from "../utils";
import { ActiveEvents } from "../interface";
import fs from "node:fs";
import path from "node:path";
import { DateTime } from "luxon";
import getActiveEvents from "../utils/timeline/getActiveEvents";
import verifyToken from "../middleware/verifyToken";

export default function initRoute(router: Router): void {
  router.get(
    "/fortnite/api/calendar/v1/timeline",
    verifyToken,
    async (req, res) => {
      const userAgent = req.headers["user-agent"];

      const Data = JSON.parse(
        fs.readFileSync(
          path.join(
            __dirname,
            "..",
            "common",
            "resources",
            "storefront",
            "shop.json"
          ),
          "utf-8"
        )
      );

      let season = getSeason(userAgent);

      if (!season) {
        return 2;
      }

      let activeEvents: ActiveEvents[] = [
        {
          eventType: `EventFlag.LobbySeason${season.season}`,
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T23:59:59.999Z",
        },
      ];

      getActiveEvents(season.buildUpdate, season.season, activeEvents);

      res.json({
        channels: {
          "client-matchmaking": {
            states: [],
            cacheExpire: Data.expiration.toString(),
          },
          "client-events": {
            states: [
              {
                validFrom: "0001-01-01T00:00:00.000Z",
                activeEvents: activeEvents,
                state: {
                  activeStorefronts: [],
                  eventNamedWeights: {},
                  seasonNumber: season.season,
                  seasonTemplateId: `AthenaSeason:athenaseason${season.season}`,
                  matchXpBonusPoints: 0,
                  seasonBegin: "2020-01-01T00:00:00Z",
                  seasonEnd: "9999-01-01T00:00:00Z",
                  seasonDisplayedEnd: "9999-01-01T00:00:00Z",
                  weeklyStoreEnd: Data.expiration.toString(),
                  stwEventStoreEnd: "9999-01-01T00:00:00.000Z",
                  stwWeeklyStoreEnd: "9999-01-01T00:00:00.000Z",
                  dailyStoreEnd: Data.expiration.toString(),
                  sectionStoreEnds: {
                    Featured: Data.expiration.toString(),
                  },
                },
              },
            ],
            cacheExpire: Data.expiration.toString(),
          },
        },
        eventsTimeOffsetHrs: 0,
        cacheIntervalMins: 10,
        currentTime: DateTime.utc().toISO(),
      });
    }
  );
}
