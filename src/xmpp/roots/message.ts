import WebSocket from "ws";
import xmlparser from "xml-parser";
import sendXmppMessageToClient from "../../utils/sendXmppMessageToClient";
import xmlbuilder from "xmlbuilder";
import Users from "../../models/Users";

async function sendXmppMessageWithSender(
  payload: any,
  senderId: string,
  accountId: string,
  id: string
): Promise<void> {
  const client = (global as any).Clients.find(
    (client: any) => client.accountId === accountId
  );
  const sender = (global as any).Clients.find(
    (client: any) => client.accountId === senderId
  );
  if (!client || !client.socket) return;
  if (!sender || !sender.socket) return;

  client.socket.send(
    xmlbuilder
      .create("message")
      .attribute("from", sender.jid)
      .attribute("id", id)
      .attribute("to", client.jid)
      .attribute("xmlns", "jabber:client")
      .element("body", `${payload}`)
      .up()
      .toString({ pretty: true })
  );
}

export default async function message(
  socket: WebSocket,
  document: xmlparser.Node,
  id: string
) {
  if (!id) {
    await socket.close();
    return;
  }

  const body = document.children.find(
    (child) => child.name === "body"
  )?.content;

  switch (body) {
    case "chat":
      const client = (global as any).Clients.find(
        (client: any) => client.accountId === (socket as any).accountId
      );
      const sender = (global as any).Clients.find(
        (client: any) =>
          client.accountId === document.attributes.to.split("@")[0]
      );

      if (!client || !client.socket) return;
      if (!sender || !sender.socket) return;

      client.socket.send(
        xmlbuilder
          .create("message")
          .attribute("to", client.jid)
          .attribute("from", sender.jid)
          .attribute("xmlns", "jabber:client")
          .attribute("type", "chat")
          .element("body", JSON.stringify(body))
          .up()
          .toString({ pretty: true })
      );
      break;

    case "groupchat":
      const muc = (global as any).MUCs[document.attributes.to.split("@")[0]];
      if (!muc) return;

      const user = await Users.findOne({
        accountId: document.attributes.to.split("@")[0],
      });

      if (!user) return;

      muc.forEach((mucClient: any) => {
        mucClient.socket.send(
          xmlbuilder
            .create("message")
            .attribute("to", mucClient.jid)
            .attribute(
              "from",
              `${muc}@muc.prod.ol.epicgames.com/${user.username}:${
                user.accountId
              }:${(global as any).resource}`
            )
            .element("body", JSON.stringify(body))
            .up()
            .toString({ pretty: true })
        );
      });
      break;

    default:
      sendXmppMessageWithSender(
        body,
        (socket as any).accountId,
        document.attributes.to.split("@")[0],
        document.attributes.id
      );
  }
}
