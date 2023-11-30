import xmlbuilder from "xmlbuilder";
import WebSocket from "ws";
import xmlparser from "xml-parser";
import log from "../../utils/log";
import { Globals, XmppClients } from "../utils/XmppTypes";
import Users from "../../models/Users";
import XmppClient from "../client/XmppClient";
import { ApplicationCommandOptionWithChoicesAndAutocompleteMixin } from "discord.js";

function parseMessageContent(content: string | undefined): string[] {
  return Buffer.from(content as string, "base64")
    .toString()
    .split("\u0000")
    .splice(1);
}

export default async function HandleAuth(
  socket: WebSocket,
  client: XmppClient,
  accountId: string,
  Authenticated: boolean,
  message: xmlparser.Node
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const parsedMessage = parseMessageContent(message.content);
      const token = Globals.AccessTokens.find(
        (data) => data.accountId === parsedMessage[0]
      );

      if (!token) {
        return log.error(`Token not found.`, "HandleAuth");
      }

      const user = await Users.findOne({
        accountId: token.accountId,
      });

      if (!user) {
        return log.error("Failed to find user.", "HandleAuth");
      }

      accountId = user.accountId;

      if (
        token.token === parsedMessage[1] &&
        token.accountId === parsedMessage[0]
      ) {
        accountId = parsedMessage[0];
        Authenticated = true;

        log.log(
          `An XMPP Client with the accountId ${accountId} has logged in.`,
          "HandleAuth",
          "cyanBright"
        );

        // @ts-ignore
        Globals.Clients[accountId] = [
          {
            accountId,
            token: token.token,
            socket: client,
          },
        ];

        socket.send(
          xmlbuilder
            .create("success")
            .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-sasl")
            .toString()
        );
      } else {
        socket.send(
          xmlbuilder
            .create("failure")
            .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-sasl")
            .ele("not-authorized")
            .ele("text")
            .attribute("xml:lang", "eng")
            .text("Password not verified")
            .end()
            .toString()
        );
        log.error("Password not verified.", "HandleAuth");
      }
    } catch (error) {
      let err: Error = error as Error;
      log.error(`Authentication failed: ${err.message}`, "HandleAuth");
      throw error;
    }
  });
}
