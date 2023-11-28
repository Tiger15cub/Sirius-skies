import { Router } from "express";
import { Globals, XmppClients } from "../xmpp/utils/XmppTypes";

export default function initRoute(router: Router): void {
  router.get("/clients", (req, res) => {
    if (Array.isArray(Globals.Clients) && Globals.Clients.length > 0) {
      let clients = Globals.Clients.map((data) => data.accountId);

      res.send(
        JSON.stringify({
          connected: Globals.Clients.length,
          clients: clients || [],
        })
      );
    } else {
      res.send(
        JSON.stringify({
          connected: 0,
          clients: [],
        })
      );
    }
  });
}
