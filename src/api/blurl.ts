import { Router } from "express";
import verifyToken from "../middleware/verifyToken";
import axios from "axios";
import fs from "node:fs";
import path from "node:path";
import log from "../utils/log";

export default function initRoute(router: Router) {
  router.get("/:video/master.:file", verifyToken, async (req, res) => {
    switch (req.params.video) {
      case "KqnBrvsHnfYFXrvo":
        if (req.params.file === "blurl") {
          res.setHeader("content-type", "application/octet-stream");
          require("../common/resources/blurls/Season12");
          res.sendFile(
            path.join(
              __dirname,
              "..",
              "common",
              "resources",
              "blurls",
              "Season12",
              "master.blurl"
            )
          );
        } else {
          log.error(
            `Cannot get /${req.params.video}/master.${req.params.file}`,
            "Blurl"
          );
          return res.status(404).json({
            error: `Cannot get /${req.params.video}/master.${req.params.file}`,
          });
        }
        break;

      default:
        if (req.params.file == "json") {
          var url = `https://raw.githubusercontent.com/BeastFNCreative/fortnite-blurl-archive/main/blurls/${req.params.video}.json`;
          res.json((await axios.get(url)).data);
        } else {
          log.error(
            `/${req.params.video}/master.${req.params.file} does not exist.`,
            "Blurl"
          );
          return res.status(404).json({
            error: `/${req.params.video}/master.${req.params.file} does not exist.`,
          });
        }
    }
  });
}
