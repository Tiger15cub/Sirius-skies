import { Router } from "express";
import { getEnv, getSeason } from "../utils";
import axios from "axios";
import getSeasonBackground from "../utils/content/getSeasonBackground";
import { v4 as uuid } from "uuid";
import { DateTime } from "luxon";
import log from "../utils/log";

export default function initRoute(router: Router): void {
  router.get("/content/api/pages/fortnite-game", async (req, res) => {
    const userAgent = req.headers["user-agent"];
    const emergencynotice_title = getEnv("EMERGENCY_NOTICE_TITLE");
    const emergencynotice_body = getEnv("EMERGENCY_NOTICE_BODY");
    const season = getSeason(userAgent);

    if (!season) {
      log.error(`Season is undefined`, "Content");
      return;
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

    getSeasonBackground(season.buildUpdate, season.season, backgrounds);

    res.json({
      "jcr:isCheckedOut": true,
      _title: "Fortnite Game",
      "jcr:baseVersion": "a7ca237317f1e74e4b8154-226a-4450-a3cd-c77af841e798",
      _activeDate: DateTime.utc().toISO(),
      lastModified: DateTime.utc().toISO(),
      _locale: "en-US",
      battleroyalenews: {
        news: {
          motds: [
            {
              entryType: "Text",
              image: "https://i.ibb.co/bPRgX2K/Sirius-Banner.png",
              titleImage: "https://i.ibb.co/bPRgX2K/Sirius-Banner.png",
              hidden: false,
              videoMute: false,
              tabTitleOverride: "Sirius",
              _type: "CommonUI Simple Message MOTD",
              title: "Sirius",
              body: "Welcome to Sirius\nMade by Skies",
              videoLoop: false,
              videoStreamingEnabled: false,
              sortingPriority: 0,
              id: uuid(),
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
              title: emergencynotice_title,
              body: emergencynotice_body,
              spotlight: true,
            },
          ],
        },
        _title: "emergencynotice",
        _activeDate: DateTime.utc().toISO(),
        lastModified: DateTime.utc().toISO(),
        _locale: "en-US",
      },
      creativenewsv2: {
        news: {
          motds: [
            {
              entryType: "Text",
              image: "https://i.ibb.co/bPRgX2K/Sirius-Banner.png",
              tileImage: "https://i.ibb.co/bPRgX2K/Sirius-Banner.png",
              videoMute: false,
              tabTitleOverride: "Sirius",
              _type: "CommonUI Simple Message MOTD",
              title: "Sirius",
              body: "Welcome to Sirius\nMade by Skies",
              videoLoop: false,
              videoStreamingEnabled: false,
              sortingPriority: 0,
              id: uuid(),
              videoAutoplay: false,
              videoFullscreen: false,
              spotlight: false,
            },
          ],
        },
        "jcr:isCheckedOut": true,
        header: "",
        style: "None",
        _noIndex: false,
        alwaysShow: false,
        "jcr:baseVersion": "a7ca237317f1e704b1a186-6846-4eaa-a542-c2c8ca7e7f29",
        _activeDate: DateTime.utc().toISO(),
        lastModified: DateTime.utc().toISO(),
        _locale: "en-US",
      },
      creative: {
        _type: "CommonUI Simple Message",
        message: {
          image:
            "https://cdn2.unrealengine.com/subgameselect-cr-512x1024-371f42541731.png",
          hidden: false,
          messagetype: "normal",
          _type: "CommonUI Simple Message Base",
          title: "New Featured Islands!",
          body: "Your Island. Your Friends. Your Rules.\n\nDiscover new ways to play Fortnite, play community made games with friends and build your dream island.",
          spotlight: false,
        },
      },
      battleroyalenewsv2: {
        news: {
          motds: [
            {
              entryType: "Text",
              image: "https://i.ibb.co/bPRgX2K/Sirius-Banner.png",
              tileImage: "https://i.ibb.co/bPRgX2K/Sirius-Banner.png",
              videoMute: false,
              hidden: false,
              tabTitleOverride: "Sirius",
              _type: "CommonUI Simple Message MOTD",
              title: "Sirius",
              body: "Welcome to Sirius\nMade by Skies",
              videoLoop: false,
              videoStreamingEnabled: false,
              sortingPriority: 0,
              id: uuid(),
              videoAutoplay: false,
              videoFullscreen: false,
              spotlight: false,
            },
          ],
        },
        "jcr:isCheckedOut": true,
        _title: "battleroyalenewsv2",
        header: "",
        style: "None",
        _noIndex: false,
        alwaysShow: false,
        "jcr:baseVersion": "a7ca237317f1e704b1a186-6846-4eaa-a542-c2c8ca7e7f29",
        _activeDate: DateTime.utc().toISO(),
        lastModified: DateTime.utc().toISO(),
        _locale: "en-US",
      },
      emergencynoticev2: {
        "jcr:isCheckedOut": true,
        _title: "emergencynoticev2",
        _noIndex: false,
        "jcr:baseVersion": "a7ca237317f1e71fad4bd6-1b21-4008-8758-5c13f080a7eb",
        emergencynotices: {
          _type: "Emergency Notices",
          emergencynotices: [
            {
              hidden: false,
              _type: "CommonUI Emergency Notice Base",
              title: emergencynotice_title,
              body: emergencynotice_body,
            },
          ],
        },
        _activeDate: DateTime.utc().toISO(),
        lastModified: DateTime.utc().toISO(),
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
        _activeDate: DateTime.utc().toISO(),
        lastModified: DateTime.utc().toISO(),
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
      playlistinformation: {
        conversion_config: {
          enableReferences: true,
          containerName: "playlist_info",
          contentName: "playlists",
        },
        frontend_matchmaking_header_style: "Basic",
        _title: "playlistinformation",
        frontend_matchmaking_header_text: "",
        is_tile_hidden: false,
        show_ad_violator: false,
        playlist_info: {
          _type: "Playlist Information",
          playlists: [
            {
              image: "https://i.imgur.com/Dr9VVLL.png",
              playlist_name: "Playlist_ShowdownAlt_Solo",
              hidden: false,
              special_border: "None",
              _type: "FortPlaylistInfo",
            },
            {
              image: ":https://i.imgur.com/Wgh3h52.png",
              playlist_name: "Playlist_ShowdownAlt_Squads",
              hidden: false,
              special_border: "None",
              _type: "FortPlaylistInfo",
            },
            {
              image: "https://i.imgur.com/VTvRLHM.png",
              playlist_name: "Playlist_ShowdownAlt_Trios",
              hidden: false,
              special_border: "None",
              _type: "FortPlaylistInfo",
            },
            {
              image: "https://i.imgur.com/rOvlncr.jpeg",
              playlist_name: "Playlist_ShowdownAlt_Duos",
              hidden: false,
              special_border: "None",
              _type: "FortPlaylistInfo",
            },
          ],
        },
      },
    });
  });
}
