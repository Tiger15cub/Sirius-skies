import WebSocket, { RawData } from "ws";
import xmlparser from "xml-parser";
import log from "../utils/log";
import xmlbuilder from "xmlbuilder";
import path from "node:path";
import fs from "node:fs";
import { Globals } from "./types/XmppTypes";
import { SendFeatures } from "./helpers/Features";
import { parseMessageContent } from "./helpers/Parse";
import Users from "../models/Users";
import Accounts from "../models/Accounts";

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

    switch (parsedMessage["root"]["name"]) {
      case "open":
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
    }
  });
}
