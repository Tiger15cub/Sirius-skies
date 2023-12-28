import { Router } from "express";
import path from "path";

export default function initRoute(router: Router) {
  router.get("/sirius/quests/daily", (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        "..",
        "common",
        "resources",
        "quests",
        "DailyQuests.json"
      )
    );
  });

  router.get("/sirius/quests/season/:build", (req, res) => {
    switch (parseInt(req.params.build)) {
      case 9:
    }
  });
}
