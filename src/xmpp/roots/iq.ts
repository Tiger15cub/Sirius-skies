import WebSocket from "ws";
import xmlparser from "xml-parser";
import { Saves } from "../types/Saves";
import { Globals } from "../types/XmppTypes";
import xmlbuilder from "xmlbuilder";
import Users from "../../models/Users";
import Friends from "../../models/Friends";

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

      const existingClient = Globals.Clients.find(
        (client) => client.accountId === Globals.accountId
      );

      if (existingClient) {
        await socket.close();
        return;
      }

      const resourceElement = bindElement.children.find(
        (child) => child.name === "resource"
      );

      if (!resourceElement || !resourceElement.content) return;

      Saves.resource = resourceElement.content;
      Globals.jid = `${Globals.accountId}@prod.ol.epicgames.com/${Saves.resource}`;

      const clientNamespace = "jabber:client";
      const bindNamespace = "urn:ietf:params:xml:ns:xmpp-bind";

      socket.send(
        xmlbuilder
          .create("iq")
          .attribute("to", Globals.jid)
          .attribute("id", "_xmpp_bind1")
          .attribute("xmlns", clientNamespace)
          .attribute("type", "result")
          .element("bind")
          .attribute("xmlns", bindNamespace)
          .element("jid", Globals.jid)
          .up()
          .up()
          .toString()
      );
      break;

    case "_xmpp_session1":
      if (!Saves.clientExists) {
        await socket.close();
        return;
      }

      socket.send(
        xmlbuilder
          .create("iq")
          .attribute("to", Globals.jid)
          .attribute("from", "prod.ol.epicgames.com")
          .attribute("id", "_xmpp_session1")
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

      for (const friendType of acceptedFriends) {
        const friend = friendType as { accountId: string };

        const friendClient = Globals.Clients.find(
          (client) => client.accountId === friend.accountId
        );

        if (!friendClient) return;

        // const friendNamespace = "jabber:client";

        socket.send(
          xmlbuilder
            .create("presence")
            .attribute("to", Globals.jid)
            .attribute("from", friendClient.jid)
            .attribute("type", "available")
            .toString()
        );
      }

      break;

    default:
      if (!Saves.clientExists) {
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
