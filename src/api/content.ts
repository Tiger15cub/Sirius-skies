import { Router } from "express";
import { getSeason } from "../utils";
import log from "../utils/log";
import axios from "axios";

export default function initRoute(router: Router): void {
  router.get("/content/api/pages/fortnite-game", async (req, res) => {
    const userAgent = req.headers["user-agent"];
    const season = getSeason(userAgent);
    const content = await axios.get(
      "https://fortnitecontent-website-prod.ak.epicgames.com/content/api/pages/fortnite-game"
    );

    const { data } = content;

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

    res.json({
      "jcr:isCheckedOut": true,
      _title: "Fortnite Game",
      "jcr:baseVersion": "a7ca237317f1e74e4b8154-226a-4450-a3cd-c77af841e798",
      _activeDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      _locale: "en-US",
      subgameinfo: data.subgameinfo,
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
              tabTitleOverride: "Sirius",
              _type: "CommonUI Simple Message MOTD",
              title: "Sirius",
              body: "Welcome to Sirius, Made by Skies.",
              videoLoop: false,
              videoStreamingEnabled: false,
              sortingPriority: 0,
              id: "Sirius",
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
              title: "Sirius",
              body: "Github: https://github.com/Skiesuwu/Sirius",
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
      shopSections: {
        sectionList: {
          sections: [
            {
              bSortOffersByOwnership: false,
              bShowIneligibleOffersIfGiftable: false,
              bEnableToastNotification: true,
              background: {
                stage: `season${season.season}`,
                _type: "DynamicBackground",
                key: "vault",
              },
              _type: "ShopSection",
              landingPriority: 0,
              bHidden: false,
              sectionId: "Featured",
              bShowTimer: true,
              sectionDisplayName: "Featured",
              bShowIneligibleOffers: true,
            },
            {
              bSortOffersByOwnership: false,
              bShowIneligibleOffersIfGiftable: false,
              bEnableToastNotification: true,
              background: {
                stage: `season${season.season}`,
                _type: "DynamicBackground",
                key: "vault",
              },
              _type: "ShopSection",
              landingPriority: 1,
              bHidden: false,
              sectionId: "Daily",
              bShowTimer: true,
              sectionDisplayName: "Daily",
              bShowIneligibleOffers: true,
            },
            {
              bSortOffersByOwnership: false,
              bShowIneligibleOffersIfGiftable: false,
              bEnableToastNotification: false,
              background: {
                stage: `season${season.season}`,
                _type: "DynamicBackground",
                key: "vault",
              },
              _type: "ShopSection",
              landingPriority: 2,
              bHidden: false,
              sectionId: "Battlepass",
              bShowTimer: false,
              sectionDisplayName: "Battle Pass",
              bShowIneligibleOffers: false,
            },
          ],
        },
        lastModified: "9999-12-12T00:00:00.000Z",
      },
    });
  });
}
