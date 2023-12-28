import { Router } from "express";

export default function initRoute(router: Router) {
  router.post(
    "/fortnite/api/game/v2/profileToken/verify/:accountId",
    (req, res) => {
      res.status(204).end();
    }
  );
}
