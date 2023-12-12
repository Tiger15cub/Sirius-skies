import { Router } from "express";
import { Globals } from "../xmpp/types/XmppTypes";

export default function initRoute(router: Router): void {
  router.get("/clients", (req, res) => {
    if (Array.isArray(Globals.Clients)) {
      let clients = Globals.Clients.map((data) => data.accountId);

      res.json({
        connected: Globals.Clients.length,
        clients: clients,
      });
    } else {
      res.json({
        connected: 0,
        clients: [],
      });
    }
  });
}
