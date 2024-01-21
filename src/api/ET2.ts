import { Router } from "express";

export default function initRoute(router: Router) {
  router.post("/ET2/CollectData.1", (req, res) => {
    res.json({});
  });
}
