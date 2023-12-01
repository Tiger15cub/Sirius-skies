import { Router } from "express";
import { getSeason } from "../utils";
import log from "../utils/log";

export default function initRoute(router: Router): void {
  router.get("/content/api/pages/fortnite-game", (req, res) => {
    const userAgent = req.headers["user-agent"];
    const season = getSeason(userAgent);

    if (!season) {
      return 2;
    }

    let backgrounds: any[] = [
      {
        stage: `season${season.season}`,
        _type: "DynamicBackground",
        key: "lobby",
      },
      {
        stage: `season${season.season}`,
        _type: "DynamicBackground",
        key: "vault",
      },
    ];

    switch (season.buildUpdate) {
      case "10":
        backgrounds = [
          {
            stage: "seasonx",
            _type: "DynamicBackground",
            key: "lobby",
          },
          {
            stage: "seasonx",
            _type: "DynamicBackground",
            key: "vault",
          },
        ];
        break;
      case "11.31":
      case "11.40":
        backgrounds = [
          {
            stage: "winter19",
            _type: "DynamicBackground",
            key: "lobby",
          },
          {
            stage: "winter19",
            _type: "DynamicBackground",
            key: "vault",
          },
        ];
        break;
    }

    console.debug(backgrounds);

    res.json({
      "jcr:isCheckedOut": true,
      _title: "Fortnite Game",
      "jcr:baseVersion": "a7ca237317f1e74e4b8154-226a-4450-a3cd-c77af841e798",
      _activeDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      _locale: "en-US",
      battleroyalenews: {
        news: {
          motds: [
            {
              entryType: "Text",
              image:
                "https://eu-central.storage.cloudconvert.com/tasks/2aab3110-a464-4164-9dcc-615829791c10/F__ExBhXcAEjIvB.png",
              titleImage:
                "https://eu-central.storage.cloudconvert.com/tasks/2aab3110-a464-4164-9dcc-615829791c10/F__ExBhXcAEjIvB.png",
              hidden: false,
              videoMute: false,
              tabTitleOverride: "FunkyV2",
              _type: "CommonUI Simple Message MOTD",
              title: "FunkyV2",
              body: "FunkyV2 WIP, Backend by Skies",
              videoLoop: false,
              videoStreamingEnabled: false,
              sortingPriority: 0,
              id: "FunkyWoinkyBoinkyV2",
              spotlight: false,
            },
          ],
        },
      },
      emergencynotice: {
        news: {
          platform_messages: [],
          _type: "Battle Royale News",
          messages: [
            {
              hidden: false,
              _type: "CommonUI Simple Message Base",
              subgame: "br",
              title: "FunkyWoinkyBoinkyV2",
              body: "Github: https://github.com/Skiesuwu/FunkyV2",
              spotlight: true,
            },
          ],
        },
        _title: "emergencynotice",
        _activeDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        _locale: "en-US",
      },
      dynamicbackgrounds: {
        "jcr:isCheckedOut": true,
        backgrounds: {
          backgrounds,
          _type: "DynamicBackgroundList",
        },
        _title: "dynamicbackgrounds",
        _noIndex: false,
        "jcr:baseVersion": "a7ca237317f1e74e4b8154-226a-4450-a3cd-c77af841e798",
        _activeDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        _locale: "en-US",
      },
    });
  });
}
