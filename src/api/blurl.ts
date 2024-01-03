import { Router } from "express";

export default function initRoute(router: Router) {
  router.get("/:videoId/:master", (req, res) => {
    res.json({});
  });
}
