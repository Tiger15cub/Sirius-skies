import WebSocket from "ws";
import xmlparser from "xml-parser";
import { Saves } from "../types/Saves";
import { Globals } from "../types/XmppTypes";
import xmlbuilder from "xmlbuilder";
import Users from "../../models/Users";
import Friends from "../../models/Friends";
import log from "../../utils/log";

export default async function iq(
  socket: WebSocket,
  document: xmlparser.Node,
  id: string
): Promise<void> {
  if (!id) {
    await socket.close();
    return;
  }

  const rootAttributeId = document.attributes.id;

  switch (rootAttributeId) {
    case "_xmpp_bind1":
      const bind = document.children.find((child) => child.name === "bind");
      const existingClient = (global as any).Clients.find(
        (client: any) => client.accountId === (socket as any).accountId
      );
      if ((socket as any).resource || !(socket as any).accountId) return;

      if (!bind) return;
      if (existingClient) {
        socket.send(
          xmlbuilder
            .create("close")
            .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-framing")
            .toString({ pretty: true })
        );
        socket.close();
        return;
      }

      const res = document.children
        .find((i) => i.name == "bind")
        ?.children.find((i) => i.name == "resource");

      if (!res || !res.content) return;

      (socket as any).resource = res.content;
      (socket as any).jid = `${
        (socket as any).accountId
      }@prod.ol.epicgames.com/${(socket as any).resource}`;

      socket.send(
        xmlbuilder
          .create("iq")
          .attribute("to", (socket as any).jid)
          .attribute("id", "_xmpp_bind1")
          .attribute("xmlns", "jabber:client")
          .attribute("type", "result")
          .element("bind")
          .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-bind")
          .element("jid", (socket as any).jid)
          .up()
          .up()
          .toString({ pretty: true })
      );

      break;

    case "_xmpp_session1":
      socket.send(
        xmlbuilder
          .create("iq")
          .attribute("to", (socket as any).jid)
          .attribute("from", "prod.ol.epicgames.com")
          .attribute("id", "_xmpp_session1")
          .attribute("xmlns", "jabber:client")
          .attribute("type", "result")
          .toString({ pretty: true })
      );

      const user = await Friends.findOne({
        accountId: (socket as any).accountId,
      }).cacheQuery();

      if (!user) {
        await socket.close();
        return;
      }

      const acceptedFriends = user.friends.accepted;

      acceptedFriends.forEach((friend) => {
        const client = (global as any).Clients.find(
          (client: any) => client.accountId === friend.accountId
        );

        if (!client) {
          console.error("Your shit doesnt work ploosh");
          return;
        }

        let xaml = xmlbuilder
          .create("message")
          .attribute("to", (socket as any).jid)
          .attribute("xmlns", "jabber:client")
          .attribute("from", client.jid)
          .attribute("type", "available");

        if (client.lastPresenceUpdate.away) {
          xaml = xaml
            .element("show", "away")
            .up()
            .element("status", client.lastPresenceUpdate.status)
            .up();
        }

        xaml = xaml.element("status", client.lastPresenceUpdate.status).up();

        socket.send(xaml.toString({ pretty: true }));
      });
      break;

    default:
      socket.send(
        xmlbuilder
          .create("iq")
          .attribute("to", (socket as any).jid)
          .attribute("from", "prod.ol.epicgames.com")
          .attribute("id", rootAttributeId)
          .attribute("type", "result")
          .toString()
      );
      break;
  }
}
