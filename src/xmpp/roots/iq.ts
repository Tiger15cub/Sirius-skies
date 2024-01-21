import WebSocket from "ws";
import xmlparser from "xml-parser";
import { Saves } from "../types/Saves";
import { Globals } from "../types/XmppTypes";
import xmlbuilder from "xmlbuilder";
import Users from "../../models/Users";
import Friends from "../../models/Friends";
import log from "../../utils/log";
import sendPresenceUpdate from "../functions/sendPresenceUpdate";
import { findInIterable } from "../functions/findInIterable";

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
      if (Saves.resource !== "" || Globals.accountId === "") return;

      const bindElement = document.children.find(
        (child) => child.name === "bind"
      );

      if (!bindElement) return;

      const existingClient = findInIterable(
        Globals.Clients,
        (client) => client.accountId === Globals.accountId
      );

      if (existingClient) {
        return;
      }

      const resourceElement = bindElement.children.find(
        (child) => child.name === "resource"
      );
      if (!resourceElement || !resourceElement.content) return;

      Saves.resource = resourceElement.content;
      Globals.jid = `${Globals.accountId}@prod.ol.epicgames.com/${Saves.resource}`;

      socket.send(
        xmlbuilder
          .create("iq")
          .attribute("to", Globals.jid)
          .attribute("id", "_xmpp_bind1")
          .attribute("xmlns", "jabber:client")
          .attribute("type", "result")
          .element("bind")
          .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-bind")
          .element("jid", Globals.jid)
          .up()
          .up()
          .toString()
      );
      break;

    case "_xmpp_session1":
      if (!Saves.clientExists && !Saves.activeConnection) {
        await socket.close();
        return;
      }

      socket.send(
        xmlbuilder
          .create("iq")
          .attribute("to", Globals.jid)
          .attribute("from", "prod.ol.epicgames.com")
          .attribute("id", "_xmpp_session1")
          .attribute("xmlns", "jabber:client")
          .attribute("type", "result")
          .toString()
      );

      const user = await Friends.findOne({
        accountId: Globals.accountId,
      }).lean();

      if (!user) {
        await socket.close();
        return;
      }

      const acceptedFriends = user.friends.accepted;

      acceptedFriends.forEach((friend) => {
        const client = findInIterable(
          Globals.Clients,
          (client) => client.accountId === friend.accountId
        );

        if (!client) {
          return;
        }

        if (client.lastPresenceUpdate?.away) {
          sendPresenceUpdate(
            socket,
            Globals.jid,
            client.jid as string,
            client.lastPresenceUpdate.status,
            true
          );
        } else {
          sendPresenceUpdate(
            socket,
            Globals.jid,
            client.jid as string,
            client.lastPresenceUpdate?.status,
            false
          );
        }
      });
      break;

    default:
      if (!Saves.clientExists && !Saves.activeConnection) {
        await socket.close();
        return;
      }

      socket.send(
        xmlbuilder
          .create("iq")
          .attribute("to", Globals.jid)
          .attribute("from", "prod.ol.epicgames.com")
          .attribute("id", rootAttributeId || "")
          .attribute("type", "result")
          .toString()
      );
      break;
  }
}
