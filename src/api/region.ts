import { Router } from "express";

export default function initRoute(router: Router): void {
  router.post("/region/check", (req, res) => {
    res.status(201).end();
  });
}
