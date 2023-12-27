import { Router } from "express";

export default async function initRoute(router: Router) {
  router.post("/datarouter/api/v1/public/data", (req, res) => {
    const { SessionId, AppID, AppVersion, UserID, AppEnvironment, UploadType } =
      req.query;

    res.status(204).json({});
  });
}
