import WebSocket from "ws";
import { Globals } from "../types/XmppTypes";
import log from "../../utils/log";
import Friends from "../../models/Friends";
import xmlbuilder from "xmlbuilder";

export default async function updatePresenceForClientFriend(
  socket: WebSocket,
  data: any,
  isAway: boolean,
  isOffline: boolean
) {
  try {
    const sender = (global as any).Clients.find(
      (client: any) => client.socket === socket
    );

    if (sender) {
      const away = isAway ? true : false;
      const friend = await Friends.findOne({ accountId: sender.accountId });

      if (sender.lastPresenceUpdate) {
        sender.lastPresenceUpdate.away = away;
        sender.lastPresenceUpdate.status = data;

        friend?.friends.accepted.forEach((friend) => {
          const client = (global as any).Clients.find(
            (client: any) => client.accountId === friend.accountId
          );
          if (!client) return;
          
          let xml = xmlbuilder
            .create("presence")
            .attribute("to", client.jid)
            .attribute("xmlns", "jabber:client")
            .attribute("from", sender.jid)
            .attribute("type", away ? "unavailable" : "available");

          if (away)
            xml = xml.element("show", "away").up().element("status", data).up();
          else xml = xml.element("status", data).up();

          client.socket?.send(xml.toString({ pretty: true }));
        });
      }
    }
  } catch (error) {
    log.error(`An error occured: ${error}`, "updatePresenceForClientFriend");
  }
}
