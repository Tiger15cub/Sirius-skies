import { Router } from "express";
import log from "../utils/log";
import path from "node:path";

export default function initRoute(router: Router) {
  router.get("/:videoId/:fileName", (req, res) => {
    const { videoId, fileName } = req.params;

    log.debug(`${videoId}/${fileName}`, "Blurl");

    const Chapter2 = path.join(
      __dirname,
      "..",
      "common",
      "resources",
      "blurls",
      "Chapter2"
    );

    switch (videoId) {
      // Chapter 2 Season 2
      case "KqnBrvsHnfYFXrvo":
        if (fileName === "master.blurl") {
          res.setHeader("content-type", "application/octet-stream");
          res.sendFile(path.join(Chapter2, "Season2", "master.blurl"));
        } else if (fileName === "master.json") {
          res.sendFile(path.join(Chapter2, "Season2", "master.json"));
        }
        break;

      // sometimes this gets called
      case "test":
        return res.status(204).json({});
    }
  });
}
