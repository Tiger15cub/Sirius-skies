import { Router } from "express";
import { APIAssetsData } from "../utils/APIAssetsData";

export default function initRoute(router: Router) {
  router.post("/api/v1/assets/Fortnite/*/**", (req, res) => {
    if (
      req.body.hasOwnProperty("FortCreativeDiscoverySurface") &&
      req.body.FortCreativeDiscoverySurface === 0
    ) {
      res.json(APIAssetsData);
    } else {
      res.json({
        FortCreativeDiscoverySurface: {
          meta: {
            promotion: req.body.FortCreativeDiscoverySurface || 0,
          },
          assets: {},
        },
      });
    }
  });
}
