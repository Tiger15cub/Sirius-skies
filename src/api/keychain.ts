import { Router } from "express";

export default function initRoute(router: Router): void {
  router.get("/fortnite/api/storefront/v2/keychain", (req, res) => {
    res.json(require("../common/resources/storefront/keychain.json"));
  });
}
