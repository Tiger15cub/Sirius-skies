import { Router } from "express";
import Users from "../models/Users";

export default function initRoute(router: Router) {
  router.post("/fortnite/api/feedback/:accountId", async (req, res) => {
    const { accountId } = req.params;

    const user = await Users.findOne({ accountId });
    const AuthToken = req.headers["authorization"]?.split("bearer ")[1];

    if (!AuthToken)
      return res.status(404).json({ error: "Authorization token not found." });

    if (!user) return res.status(404).json({ error: "User not found." });

    res.status(204).json({});
  });
}
