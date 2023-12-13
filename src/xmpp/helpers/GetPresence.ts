import WebSocket from "ws";
import Users from "../../models/Users";
import { Globals } from "../types/XmppTypes";
import xmlbuilder from "xmlbuilder";

export async function getPresenceFromFriendId(
  socket: WebSocket,
  accountId: string,
  jid: string
) {
  const user = await Users.findOne({ accountId }).lean();

  if (!user) {
    return {
      errorMessage: "Friend not found.",
    };
  }

  user.friends.accepted.forEach((friend) => {
    const Clients = Globals.Clients.find(
      (client) => client.accountId === user.accountId
    );

    if (Clients?.lastPresenceUpdate?.away) {
      socket.send(
        xmlbuilder
          .create("presence")
          .attribute("to", jid)
          .attribute("xmlns", "jabber:client")
          .attribute("from", Clients?.jid)
          .attribute("type", "available")
          .element("show", "away")
          .up()
          .element("status", Clients?.lastPresenceUpdate?.status)
          .up()
          .toString()
      );
    } else {
      socket.send(
        xmlbuilder
          .create("presence")
          .attribute("to", jid)
          .attribute("xmlns", "jabber:client")
          .attribute("from", Clients?.jid)
          .attribute("type", "available")
          .element("status", Clients?.lastPresenceUpdate?.status)
          .up()
          .toString()
      );
    }

    socket.send(
      xmlbuilder
        .create("presence")
        .attribute("to", jid)
        .attribute("xmlns", "jabber:client")
        .attribute("from", Clients?.jid)
        .attribute("type", "available")
        .toString()
    );
  });
}
