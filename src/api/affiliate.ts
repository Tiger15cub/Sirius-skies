import { Router } from "express";
import Users from "../models/Users";
import verifyToken from "../middleware/verifyToken";
import Cache from "../middleware/Cache";

export default function initRoute(router: Router) {
  router.get(
    "/affiliate/api/public/affiliates/slug/:slug",
    Cache,
    async (req, res) => {
      const { slug } = req.params;

      const user = await Users.findOne({
        username: slug,
      }).cacheQuery();

      if (!user) return res.status(404).json({ error: "User not Found." });

      res.status(200).json({
        id: user.accountId,
        slug,
        displayName: user.username,
        status: "ACTIVE",
        verified: false,
      });
    }
  );
}
