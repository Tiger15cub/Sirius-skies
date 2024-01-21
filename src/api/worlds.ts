import { Router } from "express";

export default function initRoute(router: Router) {
  router.get("/api/v1/namespace/fn/worlds/world/:world/session", (req, res) => {
    res.json({});
  });

  router.get(
    "/api/v1/namespace/fn/worlds/world/:world/attest/:accountId",
    (req, res) => {
      res.json({});
    }
  );
}
