import { Router } from "express";
import verifyToken from "../middleware/verifyToken";
import axios from "axios";
import fs from "node:fs";
import path from "node:path";
import log from "../utils/log";

export default function initRoute(router: Router) {
  router.get("/:video/:id/:file.:format", async (req, res) => {
    const { video, id, file, format } = req.params;
    const url = `https://fortnite-vod.akamaized.net/${video}/${id}/${file}.${format}`;

    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      res.status(200).end(Buffer.from(response.data, "binary"));
    } catch (error) {
      res.status(404).end();
    }
  });

  router.get("/:video/master.:file", async (req, res) => {
    const { file, video } = req.params;

    switch (video) {
      case "KqnBrvsHnfYFXrvo":
        if (file === "blurl") {
          const blurlPath = path.join(
            __dirname,
            "..",
            "common",
            "resources",
            "blurls",
            "Season12",
            "master.blurl"
          );
          try {
            res.setHeader("content-type", "application/octet-stream");
            res.sendFile(blurlPath);
          } catch (error) {
            log.error(`Error ${error}`, "Blurl");
            return res.status(500).json({ error: "Internal Server Error" });
          }
        } else {
          log.error(`Cannot get /${video}/master.${file}`, "Blurl");
          return res.status(404).json({
            error: `Cannot get /${video}/master.${file}`,
          });
        }
        break;

      default:
        if (file === "json") {
          const url = `https://raw.githubusercontent.com/BeastFNCreative/fortnite-blurl-archive/main/blurls/${video}.json`;
          try {
            const response = await axios.get(url);
            res.json(response.data);
          } catch (error) {
            log.error(`/${video}/master.${file} does not exist.`, "Blurl");
            return res.status(404).json({
              error: `/${video}/master.${file} does not exist.`,
            });
          }
        } else {
          log.error(`/${video}/master.${file} does not exist.`, "Blurl");
          return res.status(404).json({
            error: `/${video}/master.${file} does not exist.`,
          });
        }
    }
  });
}
