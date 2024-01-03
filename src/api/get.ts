import { Router } from "express";

export default function initRoute(router: Router) {
  router.get("/api/v1/Fortnite/get", (req, res) => {
    res.json({
      interactions: [],
    });
  });
}
