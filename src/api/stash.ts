import { Router } from "express";
import verifyToken from "../middleware/verifyToken";

export default function initRoute(router: Router) {
  router.get(
    "/fortnite/api/game/v2/br-inventory/account/:accountId",
    verifyToken,
    async (req, res) => {
      res.json({
        stash: {
          globalcash: 0,
        },
      });
    }
  );
}
