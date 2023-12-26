import { Router } from "express";
import verifyToken from "../middleware/verifyToken";

export default function initRoute(router: Router): void {
  router.get(
    "/presence/api/v1/_/:accountId/subscriptions/nudged",
    verifyToken,
    (req, res) => {
      res.contentType("application/json");
      res.json([]);
    }
  );

  router.get(
    "/presence/api/v1/_/:accountId/last-online",
    verifyToken,
    async (req, res) => {
      res.contentType("application/json");
      res.json([]);
    }
  );

  router.get(
    "/presence/api/v1/_/:accountId/settings/subscriptions",
    verifyToken,
    async (req, res) => {
      res.contentType("application/json");
      res.json([]);
    }
  );
}
