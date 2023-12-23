import { Router } from "express";
import path from "path";

export default function initRoute(router: Router) {
  router.get("/api/daily", (req, res) => {
    res.contentType("application/json");

    res.json(
      require(path.join(
        __dirname,
        "..",
        "common",
        "resources",
        "quests",
        "DailyQuests.json"
      ))
    );
  });
}
