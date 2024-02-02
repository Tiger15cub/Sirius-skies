import { Router } from "express";
import { getSeason } from "../utils";
import { ActiveEvents } from "../interface";
import fs from "node:fs/promises";
import path from "node:path";
import { DateTime } from "luxon";
import getActiveEvents from "../utils/timeline/getActiveEvents";
import verifyToken from "../middleware/verifyToken";
import log from "../utils/log";

export default function initRoute(router: Router): void {
  router.get("/fortnite/api/calendar/v1/timeline", async (req, res) => {
    const userAgent = req.headers["user-agent"];

    let season = getSeason(userAgent);

    if (!season) {
      log.error(`Season is undefined`, "Timeline");
      return;
    }

    let activeEvents: any[] = [
      {
        eventType: `EventFlag.${season.lobby}`,
        activeUntil: "9999-12-31T23:59:59.999Z",
        activeSince: "2020-01-01T23:59:59.999Z",
      },
      {
        eventType: `EventFlag.Season${season.season}`,
        activeUntil: "9999-12-31T23:59:59.999Z",
        activeSince: "2020-01-01T23:59:59.999Z",
      },
      {
        eventType: `EventFlag.LobbySeason${season.season}`,
        activeUntil: "9999-12-31T23:59:59.999Z",
        activeSince: "2020-01-01T23:59:59.999Z",
      },
    ];

    getActiveEvents(season.buildUpdate, season.season, activeEvents);

    const date = DateTime.utc().setZone("GMT");
    const expiration = date.startOf("day").plus({ days: 1 }).toISO();

    res.json({
      channels: {
        "client-matchmaking": {
          states: [],
          cacheExpire: expiration,
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
                weeklyStoreEnd: expiration,
                stwEventStoreEnd: "9999-01-01T00:00:00.000Z",
                stwWeeklyStoreEnd: "9999-01-01T00:00:00.000Z",
                dailyStoreEnd: expiration,
                sectionStoreEnds: {
                  Featured: expiration,
                },
              },
            },
          ],
          cacheExpire: expiration,
        },
      },
      eventsTimeOffsetHrs: 0,
      cacheIntervalMins: 10,
      currentTime: DateTime.utc().toISO(),
    });
  });
}
