import { Router } from "express";
import { getStorefront } from "../utils/storefront/generateStorefront";

export default function initRoute(router: Router) {
  router.get("/fortnite/api/storefront/v2/catalog", async (req, res) => {
    getStorefront(res);
  });
}
