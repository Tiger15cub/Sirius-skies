import { Router } from "express";
import { Globals, XmppClients } from "../xmpp/utils/XmppTypes";

export default function initRoute(router: Router): void {
  router.get("/clients", (req, res) => {
    console.debug(JSON.stringify(Globals.Clients));
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
