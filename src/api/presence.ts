import { Router } from "express";

export default function initRoute(router: Router): void {
  router.get(
    "/presence/api/v1/_/:accountId/subscriptions/nudged",
    (req, res) => {
      res.contentType("application/json");
      res.json([]);
    }
  );

  router.get("/presence/api/v1/_/:accountId/last-online", (req, res) => {
    res.contentType("application/json");
    res.json([]);
  });

  router.get(
    "/presence/api/v1/_/:accountId/settings/subscriptions",
    (req, res) => {
      res.contentType("application/json");
      res.json([]);
    }
  );
}
