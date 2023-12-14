import xmlbuilder from "xmlbuilder";
import WebSocket from "ws";
import { Globals, XmppClients } from "../types/XmppTypes";
import Users from "../../models/Users";

export async function UpdatePresenceForFriend(
  socket: WebSocket,
  offline: boolean,
  away: boolean,
  body: string
) {
  const senderClient = Globals.Clients.find((c) => c.socket === socket);

  if (!senderClient) {
    return;
  }

  const user = await Users.findOne({
    accountId: senderClient.accountId,
  }).lean();

  if (!user) {
    return;
  }

  user.friends.accepted.forEach((friend) => {
    const client = Globals.Clients.find(
      (c) => c.accountId === friend.accountId
    );

    if (!client) {
      return;
    }

    const status = offline ? "unavailable" : "available";

    const presenceXml = xmlbuilder
      .create("presence")
      .attribute("to", client.jid)
      .attribute("xmlns", "jabber:client")
      .attribute("from", senderClient.jid)
      .attribute("type", status);

    if (away) {
      presenceXml.element("show", "away").up().element("status", body);
    } else {
      presenceXml.element("status", body);
    }

    client.socket.send(presenceXml.up().toString());
    client.socket.send(presenceXml.toString());
  });
}
