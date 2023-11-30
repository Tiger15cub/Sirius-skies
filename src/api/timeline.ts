import { Router } from "express";
import fs from "fs";
import path from "path";
import { getSeason } from "../utils";
import { ActiveEvents } from "../interface";
import log from "../utils/log";

export default function initRoute(router: Router): void {
  router.get("/fortnite/api/calendar/v1/timeline", (req, res) => {
    const userAgent = req.headers["user-agent"];

    let season = getSeason(userAgent);

    const now = new Date();
    const resetTime = new Date(now);
    resetTime.setUTCHours(0, 0, 0, 0); // Reset at 00:00 UTC

    const timeUntilReset =
      resetTime > now
        ? resetTime.getTime() - now.getTime()
        : 24 * 60 * 60 * 1000 - (now.getTime() - resetTime.getTime());

    let activeEvents: ActiveEvents[] = [
      {
        eventType: `EventFlag.LobbySeason${season}`,
        activeUntil: "9999-12-31T23:59:59.999Z",
        activeSince: "2020-01-01T23:59:59.999Z",
      },
    ];

    if (season === "11.31" || season === "11.40") {
      activeEvents = [
        {
          eventType: "EventFlag.Winterfest.Tree",
          activeUntil: "9999-01-01T00:00:00.000Z",
          activeSince: "9999-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.LTE_WinterFest",
          activeUntil: "9999-01-01T00:00:00.000Z",
          activeSince: "9999-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.LTE_WinterFest2019",
          activeUntil: "9999-01-01T00:00:00.000Z",
          activeSince: "9999-01-01T00:00:00.000Z",
        },
      ];
    }

    console.debug(JSON.stringify(activeEvents));

    res.status(204).json({
      channels: {
        "client-matchmaking": {
          states: [],
          cacheExpire: "9999-01-01T00:00:00.000Z",
        },
        "client-events": {
          states: [
            {
              validFrom: "0001-01-01T00:00:00.000Z",
              activeEvents,
              state: {
                activeStorefronts: [],
                eventNamedWeights: {},
                seasonNumber: season,
                seasonTemplateId: `AthenaSeason:athenaseason${season}`,
                matchXpBonusPoints: 0,
                seasonBegin: "2020-01-01T00:00:00Z",
                seasonEnd: "9999-01-01T00:00:00Z",
                seasonDisplayedEnd: "9999-01-01T00:00:00Z",
                weeklyStoreEnd: new Date(
                  now.getTime() + timeUntilReset
                ).toISOString(),
                stwEventStoreEnd: new Date(
                  now.getTime() + timeUntilReset
                ).toISOString(),
                stwWeeklyStoreEnd: new Date(
                  now.getTime() + timeUntilReset
                ).toISOString(),
                sectionStoreEnds: {
                  Featured: new Date(
                    now.getTime() + timeUntilReset
                  ).toISOString(),
                },
                dailyStoreEnd: new Date(
                  now.getTime() + timeUntilReset
                ).toISOString(),
              },
            },
          ],
          cacheExpire: new Date(now.getTime() + timeUntilReset).toISOString(),
        },
      },
      eventsTimeOffsetHrs: 0,
      cacheIntervalMins: 10,
      currentTime: new Date().toISOString(),
    });
  });
}
