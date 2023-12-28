import { Router } from "express";

export default function initRoute(router: Router) {
  router.get("/socialban/api/public/v1/:accountId", (req, res) => {
    res
      .json({
        bans: [],
        warnings: [],
      })
      .status(204);
  });
}
