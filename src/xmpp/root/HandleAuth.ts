import xmlbuilder from "xmlbuilder";
import WebSocket from "ws";
import xmlparser from "xml-parser";
import log from "../../utils/log";
import { Globals, XmppClients } from "../helpers/XmppTypes";
import Users from "../../models/Users";
import XmppClient from "../client/XmppClient";
import { ApplicationCommandOptionWithChoicesAndAutocompleteMixin } from "discord.js";

export function parseMessageContent(content: string | undefined): string[] {
  return Buffer.from(content as string, "base64")
    .toString()
    .split("\u0000");
}

export default async function HandleAuth(
  socket: WebSocket,
  client: XmppClient,
  accountId: string,
  displayName: string,
  Authenticated: boolean,
  message: xmlparser.Node,
  token: string
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const parsedMessage = parseMessageContent(message.content);

      const AccessTokens = Globals.AccessTokens.find(
        (data) => data.accountId === parsedMessage[1]
      );

      if (!AccessTokens) {
        return log.error(`Token does not exist.`, "HandleAuth");
      }

      const user = await Users.findOne({
        accountId: AccessTokens.accountId,
      }).lean();

      if (!user) return log.error("User not found.", "HandleAuth");

      accountId = user.accountId;
      displayName = user.username;
      token = parsedMessage[2];

      if (
        parsedMessage &&
        accountId &&
        displayName &&
        token &&
        parsedMessage.length === 3
      ) {
        Authenticated = true;

        log.log(
          `An XMPP Client with the username ${displayName} has logged in.`,
          "HandleAuth",
          "blueBright"
        );

        Globals.Clients.push({
          accountId,
          displayName,
          token,
          socket: client,
        });

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
            .text("Password not verified.")
            .end()
            .toString()
        );
        log.error(
          `Password not verified: ${AccessTokens.token}:${parsedMessage[1]}`,
          "HandleAuth"
        );
      }
    } catch (error) {
      let err: Error = error as Error;
      log.error(`Authentication failed: ${err.message}`, "HandleAuth");
      throw error;
    }
  });
}
