import { Router } from "express";
import path from "node:path";
import fs from "node:fs";
import { getSeason } from "../utils";
import log from "../utils/log";
import { Discovery, LinkData, Panel, Result } from "../interface";

async function findPlaylist(
  discovery: Discovery,
  condition: (result: Result) => boolean
): Promise<LinkData | null> {
  for (const panel of discovery.Panels) {
    for (const page of panel.Pages) {
      for (const result of page.results) {
        if (condition(result)) {
          return result.linkData;
        }
      }
    }
  }
  return null;
}

interface PlaylistImages {
  [mnemonic: string]: string;
}

function updatePlaylistImage(
  result: Result,
  playlistImages: PlaylistImages
): string | null {
  const { mnemonic, metadata } = result.linkData;
  const { image_url } = metadata;

  if (image_url !== playlistImages[mnemonic]) {
    metadata.image_url = playlistImages[mnemonic];
    return result.linkCode;
  } else {
    log.warn(`Playlist image for ${mnemonic} is already updated.`, "Discovery");
  }

  return null;
}

export default async function initRoute(router: Router): Promise<void> {
  const discoveryPath = path.join(
    __dirname,
    "..",
    "common",
    "resources",
    "discovery",
    "discovery.json"
  );

  let discovery: Discovery;
  try {
    const data = fs.readFileSync(discoveryPath, "utf-8");
    discovery = JSON.parse(data);

    const playlistImages: Record<string, string> = {
      playlist_defaultsolo:
        "https://cdn2.unrealengine.com/Fortnite/fortnite-game/playlisttiles/BR_LobbyTileArt_Solo-512x512-24446ea2a54612c5604ecf0e30475b4dec81c3bc.png",
      playlist_defaultduo:
        "https://cdn2.unrealengine.com/Fortnite/fortnite-game/playlisttiles/BR_LobbyTileArt_Duo-512x512-5dea8dfae97bddcd4e204dd47bfb245d3f68fc7b.png",
      playlist_trios: "",
      playlist_defaultsquad:
        "https://cdn2.unrealengine.com/Fortnite/fortnite-game/playlisttiles/BR_LobbyTileArt_Squad-512x512-5225ec6ca3265611957834c2c549754fe1778449.png",
      Playlist_PlaygroundV2:
        "https://cdn2.unrealengine.com/Fortnite/fortnite-game/playlistinformation/CM_LobbyTileArt-1024x512-fbcd48db36552ccb1ab4021b722ea29d515377cc.jpg",
      Playlist_Playground:
        "https://cdn2.unrealengine.com/Fortnite/fortnite-game/playlisttiles/BR_LTM-Tile_Playground-1024x512-53db8a4b5fb41251af279eaf923bc00ecbc17792.jpg",

      // Party Royale
      playlist_papaya:
        "https://cdn2.unrealengine.com/partyroyale-1920-1920x1080-7001724bc7ab.jpg",

      // Events
      playlist_music_med:
        "https://cdn2.unrealengine.com/Fortnite/fortnite-game/playlistinformation/v94/09BR_RobotFight_ModeTile-1024x512-2a5383ab45d733d276100a14092da01c5db66fb7.jpg",
      playlist_music_low:
        "https://cdn2.unrealengine.com/Fortnite/fortnite-game/playlistinformation/v94/09BR_RobotFight_ModeTile-1024x512-2a5383ab45d733d276100a14092da01c5db66fb7.jpg",
      playlist_music_high:
        "https://cdn2.unrealengine.com/Fortnite/fortnite-game/playlistinformation/v94/10BR_In-Game_Farewell_ModeTile-1024x512-3c6326529cb23dbe465594a4266f2054ba52e4ad.jpg",
      playlist_music_highest:
        "https://cdn2.unrealengine.com/Fortnite/fortnite-game/playlistinformation/v94/09BR_RobotFight_ModeTile-1024x512-2a5383ab45d733d276100a14092da01c5db66fb7.jpg",
      playlist_kiwi:
        "https://cdn2.unrealengine.com/17br-kiwi-keyart-motd-1920x1080-1920x1080-50ccef17c86f.jpg",
      playlist_guava:
        "https://cdn2.unrealengine.com/18br-guava-playlisttile-1920x1080-1920x1080-e66a6a0a08cf.jpg",
      playlist_armadillo:
        "https://cdn2.unrealengine.com/20br-armadillo-creativetile-tile-1920x1080-1920x1080-f40652491ad0.jpg",
      playlist_radish: "https://i.ibb.co/k3h33NC/Fracture.png",
    };

    let updatedPlaylists: string[] = [];

    for (const panel of discovery.Panels) {
      for (const page of panel.Pages) {
        for (const result of page.results) {
          const updatedPlaylistId = updatePlaylistImage(result, playlistImages);
          if (updatedPlaylistId) {
            updatedPlaylists.push(updatedPlaylistId);
          }
        }
      }
    }

    if (updatedPlaylists.length > 0) {
      fs.writeFileSync(discoveryPath, JSON.stringify(discovery, null, 2));
      for (const updatedPlaylist of updatedPlaylists) {
        log.log(`Updated Image for ${updatedPlaylist}`, "Discovery", "green");
      }
    } else {
      log.error("No playlists were updated.", "Discovery");
    }
  } catch (error) {
    let err: Error = error as Error;
    log.error(
      `Error reading or parsing discovery file: ${err.message}`,
      "Discovery"
    );
    process.exit(1);
  }

  router.get("/links/api/fn/mnemonic/:playlist/related", (req, res) => {
    const { playlist } = req.params;

    if (playlist) {
      findPlaylist(discovery, (result) => result.linkData.mnemonic === playlist)
        .then((playlistData) => {
          if (playlistData) {
            res.json({ links: { [playlist]: playlistData } });
          } else {
            res.json({ error: "Playlist not found." });
          }
        })
        .catch((error) => {
          log.error(`Error finding playlist: ${error}`, "Discovery");
          res.json({ error: "Internal server error." });
        });
    } else {
      res.json({ error: "Invalid playlist parameter." });
    }
  });

  router.get("/links/api/fn/mnemonic/*", (req, res) => {
    const playlist = req.url.split("/").slice(-1)[0];

    if (playlist) {
      findPlaylist(discovery, (result) => result.linkData.mnemonic === playlist)
        .then((playlistData) => {
          if (playlistData) {
            res.json(playlistData);
          } else {
            res.json({ error: "Playlist not found." });
          }
        })
        .catch((error) => {
          log.error(`Error finding playlist: ${error}`, "Discovery");
          res.json({ error: "Internal server error." });
        });
    } else {
      res.json({ error: "Invalid playlist parameter." });
    }
  });

  router.post("*/discovery/surface/*", (req, res) => {
    res.json(discovery);
  });

  router.post("/links/api/fn/mnemonic", (req, res) => {
    const results = discovery.Panels.flatMap((panel: Panel) =>
      panel.Pages.flatMap((page) => page.results)
    );
    const playlistLinksArray = results.map((result: Result) => result.linkData);

    res.json(playlistLinksArray);
  });
}
