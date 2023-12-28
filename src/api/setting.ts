import { Router } from "express";
import Users from "../models/Users";
import Accounts from "../models/Accounts";

export default function initRoute(router: Router) {
  router.post("/api/v1/user/setting", async (req, res) => {
    const { accountId } = req.body;

    const user = await Users.findOne({ accountId });
    const account = await Accounts.findOne({ accountId });

    if (!user) {
      return res.status(404).json({ error: "Failed to find User." });
    }

    if (!account) {
      return res.status(404).json({ error: "Failed to find Account." });
    }

    res.json([
      {
        accountId: user.accountId,
        key: "avatar",
        value: account.character.items.toString().toLowerCase(),
      },
      {
        accountId: user.accountId,
        key: "avatarBackground",
        value: '["#B4F2FE","#00ACF2","#005679"]',
      },
      {
        accountId: user.accountId,
        key: "appInstalled",
        value: "init",
      },
    ]);
  });
}
