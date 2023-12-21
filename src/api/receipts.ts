import { Router } from "express";
import log from "../utils/log";

export default function initRoute(router: Router) {
  router.get(
    "/fortnite/api/receipts/v1/account/:accountId/receipts",
    (req, res) => {
      res.json({});
    }
  );
}
