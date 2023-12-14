import WebSocket from "ws";
import Users from "../../models/Users";
import { Globals, XmppClients } from "../types/XmppTypes";
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

export async function GetPresenceFromId(
  sender: string,
  client: string,
  offline: boolean
) {
  const clients: XmppClients | undefined = Globals.Clients.find(
    (c) => c.accountId === client
  );
  const senderClient: XmppClients | undefined = Globals.Clients.find(
    (s) => s.accountId === sender
  );

  const status: string = offline ? "unavailable" : "available";
  const lastPresenceUpdate = senderClient?.lastPresenceUpdate;

  const presenceXml = xmlbuilder
    .create("presence")
    .attribute("to", clients?.jid)
    .attribute("xmlns", "jabber:client")
    .attribute("from", senderClient?.jid)
    .attribute("type", status);

  if (lastPresenceUpdate) {
    presenceXml.element("status", lastPresenceUpdate.status);

    if (lastPresenceUpdate.away) {
      presenceXml.element("show", "away");
    }
  }

  clients?.socket.send(presenceXml.up().toString());
  return clients?.socket.send(presenceXml.toString());
}
