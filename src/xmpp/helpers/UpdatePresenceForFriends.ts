import xmlbuilder from "xmlbuilder";
import Users from "../../models/Users";
import { Globals } from "./XmppTypes";
import WebSocket from "ws";
import xmlparser from "xml-parser";

export default async function UpdatePresenceForFriends(
  socket: WebSocket,
  jid: string,
  accountId: string,
  message: xmlparser.Node
) {
  const user = await Users.findOne({ accountId });

  // if (await Users.findOne({ accountId }))

  if (user) {
    const { accepted } = user.friends;
    await Promise.all(
      accepted.map(async (friend) => {
        if (Globals.Clients[friend.accountId]) {
          socket.send(
            xmlbuilder
              .create("presence")
              .attribute("to", jid)
              .attribute("xmlns", "jabber:client")
              .attribute("from", jid.split("/")[0])
              .attribute(
                "status",
                message.children.find((data) => data.name === "status")?.content
              )
              .up()
              .toString()
          );
        }
      })
    );
  }
}
