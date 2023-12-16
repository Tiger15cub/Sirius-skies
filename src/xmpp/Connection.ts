import WebSocket, { RawData } from "ws";
import xmlparser from "xml-parser";
import log from "../utils/log";
import xmlbuilder from "xmlbuilder";
import path from "node:path";
import fs from "node:fs";
import { Clients, Globals } from "./types/XmppTypes";
import { SendFeatures } from "./helpers/Features";
import { parseMessageContent } from "./helpers/Parse";
import Users from "../models/Users";
import Accounts from "../models/Accounts";
import { getPresenceFromFriendId } from "./helpers/GetPresence";
import { SendMessageToClient } from "./helpers/SendMessage";
import { GetPresenceFromId } from "./helpers/GetPresence";
import { UpdatePresenceForFriend } from "./helpers/UpdatePresence";

export function Connection(socket: WebSocket): void {
  socket.on("error", () => {});

  const configPath = path.join(process.cwd(), "config", "XmppConfig.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  socket.on("message", async (message: RawData | string) => {
    if (Buffer.isBuffer(message)) message = message.toString();

    let stringifiedMessage = message as string;

    const parsedMessage = xmlparser(stringifiedMessage);

    if (!parsedMessage || !parsedMessage.root || !parsedMessage.root.name) {
      return log.error("An error has occured", "Message");
    }

    const { root } = parsedMessage;
    const { attributes, children } = root;

    var test: any[] = [];

    switch (root.name) {
      case "open":
        console.debug(root.name);
        socket.send(
          xmlbuilder
            .create("open")
            .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-framing")
            .attribute("from", config.Domain)
            .attribute("id", Globals.UUID)
            .attribute("version", "1.0")
            .attribute("xml:lang", "en")
            .toString()
        );

        SendFeatures(Globals.isAuthenticated, socket);

        break;

      case "auth":
        console.debug(root.name);
        if (Globals.accountId) return;

        let decodedContent = parseMessageContent(parsedMessage.root.content);

        let AccessTokens = Globals.AccessTokens.find(
          (data) => data.token === decodedContent[2]
        );

        if (!AccessTokens) {
          return log.error("object is undefined.", "Message");
        }

        const user = await Users.findOne({ accountId: AccessTokens.accountId });

        if (!user) {
          return log.error("User not found.", "Message");
        }

        Globals.accountId = user.accountId;
        Globals.token = AccessTokens.token;

        if (
          decodedContent &&
          Globals.accountId &&
          Globals.token &&
          decodedContent.length === 3
        ) {
          Globals.isAuthenticated = true;
          log.log(
            `An XMPP Client with the accountId ${Globals.accountId} has logged in.`,
            "XMPP",
            "blue"
          );

          await Accounts.updateOne({ accessToken: AccessTokens });

          Globals.Clients.push({
            accountId: Globals.accountId,
            token: Globals.token,
            socket,
          });

          socket.send(
            xmlbuilder
              .create("success")
              .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-sasl")
              .toString()
          );
        } else {
          log.error("Failed to authenticate user.", "Message");
        }
        break;

      case "iq":
        console.debug(root.name);
        switch (attributes.id) {
          case "_xmpp_bind1":
            console.debug(attributes.id);
            const to =
              attributes.to ||
              `${Globals.accountId}@${config.Domain}/${
                children
                  .find((data) => data.name === "bind")
                  ?.children.find((c) => c.name === "resource")?.content
              }`;

            Globals.jid = to;

            Globals.Clients.push({
              accountId: Globals.accountId,
              token: Globals.token,
              jid: Globals.jid,
              socket,
            });

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
                .toString()
            );
            break;

          case "_xmpp_session1":
            console.debug(attributes.id);
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
            await getPresenceFromFriendId(
              socket,
              Globals.accountId,
              Globals.jid
            );
            break;

          default:
            socket.send(
              xmlbuilder
                .create("iq")
                .attribute("to", Globals.jid)
                .attribute("from", config.Domain)
                .attribute("id", attributes.id)
                .attribute("xmlns", "jabber:client")
                .attribute("type", "result")
                .toString()
            );
            break;
        }
        break;

      case "message":
        console.debug(root.name);
        switch (attributes.type) {
          case "chat":
            console.debug(attributes.type);
            let clientReceiver = Globals.Clients.find(
              () => Globals.jid.split("/")[0] === attributes.to
            );

            if (!clientReceiver) return;

            clientReceiver.socket.send(
              xmlbuilder
                .create("message")
                .attribute("to", clientReceiver.jid)
                .attribute("from", Globals.jid)
                .attribute("xmlns", "jabber:client")
                .attribute("type", "chat")
                .element(
                  "body",
                  children.find((data) => data.name === "body")?.content
                )
                .up()
                .toString()
            );
            return;

          case "groupchat":
            console.debug(attributes.type);
            const MUC = Globals.MUCs[attributes.to.split("@")[0]];

            if (!MUC) return;

            return;
        }

        if (
          JSON.parse(
            children.find((data) => data.name === "body")?.content as string
          )
        ) {
          SendMessageToClient(
            Globals.jid,
            children.find((data) => data.name === "content")?.content as string,
            parsedMessage
          );
        }
        break;

      case "presence":
        switch (attributes.type) {
          case "unavailable":
            const to = attributes.to.toLowerCase();

            if (
              to.endsWith(`@muc.${config.Domain}`) ||
              to.split("/")[0].endsWith(`@muc.${config.Domain}`)
            ) {
              const roomName = to.split("@")[0];

              if (!Globals.MUCs[roomName]) return;

              const member = Globals.MUCs[roomName];
              const Index = member.members.findIndex(
                (muc: any) => muc.accountId === Globals.accountId
              );

              if (Index != -1) {
                member.members.splice(Index, 1);

                test.splice(test.indexOf(roomName), 1);
              }

              socket.send(
                xmlbuilder
                  .create("presence")
                  .attribute("to", Globals.jid)
                  .attribute(
                    "from",
                    `${roomName}@muc.${config.Domain}/${encodeURI(
                      Globals.accountId
                    )}:${Globals.accountId}:${
                      children
                        .find((data) => data.name === "bind")
                        ?.children.find((c) => c.name === "resource")?.content
                    }`
                  )
                  .attribute("xmlns", "jabber:client")
                  .attribute("type", "unavailable")
                  .element("x")
                  .attribute("xmlns", "http://jabber.org/protocol/muc#user")
                  .element("item")
                  .attribute(
                    "nick",
                    `${roomName}@muc.${config.Domain}/${encodeURI(
                      Globals.accountId
                    )}:${Globals.accountId}:${
                      children
                        .find((data) => data.name === "bind")
                        ?.children.find((c) => c.name === "resource")?.content
                    }`.replace(`${roomName}@muc.${config.Domain}/`, "")
                  )
                  .attribute("jid", Globals.jid)
                  .attribute("role", "none")
                  .up()
                  .element("status")
                  .attribute("code", "110")
                  .up()
                  .element("status")
                  .attribute("code", "100")
                  .up()
                  .element("status")
                  .attribute("code", "170")
                  .up()
                  .up()
                  .toString()
              );
              return;
            }
            break;

          default:
            if (
              children.find((c) => c.name === "muc:x") ||
              children.find((c) => c.name === "x")
            ) {
              const roomName = attributes.to.split("@")[0];

              const member = Globals.MUCs[roomName];
              member.push({ accountId: Globals.accountId });
              test.push(roomName);

              socket.send(
                xmlbuilder
                  .create("presence")
                  .attribute("to", Globals.jid)
                  .attribute(
                    "from",
                    `${roomName}@muc.${config.Domain}/${encodeURI(
                      Globals.accountId
                    )}:${Globals.accountId}:${
                      children
                        .find((data) => data.name === "bind")
                        ?.children.find((c) => c.name === "resource")?.content
                    }`
                  )
                  .attribute("xmlns", "jabber:client")
                  .element("x")
                  .attribute("xmlns", "http://jabber.org/protocol/muc#user")
                  .element("item")
                  .attribute(
                    "nick",
                    `${roomName}@muc.${config.Domain}/${encodeURI(
                      Globals.accountId
                    )}:${Globals.accountId}:${
                      children
                        .find((data) => data.name === "bind")
                        ?.children.find((c) => c.name === "resource")?.content
                    }`.replace(`${roomName}@muc.${config.Domain}/`, "")
                  )
                  .attribute("jid", Globals.jid)
                  .attribute("role", "participant")
                  .attribute("affiliation", "none")
                  .up()
                  .element("status")
                  .attribute("code", "110")
                  .up()
                  .element("status")
                  .attribute("code", "100")
                  .up()
                  .element("status")
                  .attribute("code", "170")
                  .up()
                  .element("status")
                  .attribute("code", "201")
                  .up()
                  .up()
                  .toString()
              );

              member.members.forEach((mem: any) => {
                const Client = Globals.Clients.find(
                  (c) => c.accountId === mem.accountId
                );

                socket.send(
                  xmlbuilder
                    .create("presence")
                    .attribute(
                      "from",
                      `${roomName}@muc.${config.Domain}/${encodeURI(
                        Globals.accountId
                      )}:${Globals.accountId}:${
                        children
                          .find((data) => data.name === "bind")
                          ?.children.find((c) => c.name === "resource")?.content
                      }`
                    )
                    .attribute("to", Client?.jid)
                    .attribute("xmlns", "jabber:client")
                    .element("x")
                    .attribute("xmlns", "http://jabber.org/protocol/muc#user")
                    .element("item")
                    .attribute(
                      "nick",
                      `${roomName}@muc.${config.Domain}/${encodeURI(
                        Globals.accountId
                      )}:${Globals.accountId}:${
                        children
                          .find((data) => data.name === "bind")
                          ?.children.find((c) => c.name === "resource")?.content
                      }`.replace(`${roomName}@muc.${config.Domain}/`, "")
                    )
                    .attribute("jid", Globals.jid)
                    .attribute("role", "participant")
                    .attribute("affiliation", "none")
                    .up()
                    .up()
                    .toString()
                );

                Client?.socket.send(
                  xmlbuilder
                    .create("presence")
                    .attribute(
                      "from",
                      `${roomName}@muc.${config.Domain}/${encodeURI(
                        Globals.accountId
                      )}:${Globals.accountId}:${
                        children
                          .find((data) => data.name === "bind")
                          ?.children.find((c) => c.name === "resource")?.content
                      }`
                    )
                    .attribute("to", Client?.jid)
                    .attribute("xmlns", "jabber:client")
                    .element("x")
                    .attribute("xmlns", "http://jabber.org/protocol/muc#user")
                    .element("item")
                    .attribute(
                      "nick",
                      `${roomName}@muc.${config.Domain}/${encodeURI(
                        Globals.accountId
                      )}:${Globals.accountId}:${
                        children
                          .find((data) => data.name === "bind")
                          ?.children.find((c) => c.name === "resource")?.content
                      }`.replace(`${roomName}@muc.${config.Domain}/`, "")
                    )
                    .attribute("jid", Globals.jid)
                    .attribute("role", "participant")
                    .attribute("affiliation", "none")
                    .up()
                    .up()
                    .toString()
                );
              });

              return;
            }

            await UpdatePresenceForFriend(
              socket,
              false,
              children.find((data) => data.name === "status") ? true : false,
              children.find((data) => data.name === "status")?.content as string
            );
            await GetPresenceFromId(
              Globals.accountId,
              Globals.accountId,
              false
            );
            break;
        }

        if (
          Globals.accountId &&
          Globals.token &&
          Globals.jid &&
          Globals.UUID &&
          test &&
          Globals.isAuthenticated
        ) {
          Globals.Clients.push({
            socket,
            accountId: Globals.accountId,
            token: Globals.token,
            jid: Globals.jid,
            lastPresenceUpdate: {
              away: false,
              status: "{}",
            },
          });
        }
    }
  });
}
