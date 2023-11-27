import { Router } from "express";
import { Globals } from "../xmpp/utils/XmppTypes";

export default function initRoute(router: Router): void {
  router.get("/clients", (req, res) => {
    res.send(
      JSON.stringify({
        connected: Object.keys(Globals.Clients).length,
        clients: Globals.Clients[0].map((data) => data.accountId),
      })
    );
  });
}
