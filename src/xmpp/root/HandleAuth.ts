import xmlbuilder from "xmlbuilder";
import WebSocket from "ws";
import xmlparser from "xml-parser";
import log from "../../utils/log";
import Users from "../../models/Users";

function parseMessageContent(content: string | undefined): string[] {
  return Buffer.from(content as string, "base64")
    .toString()
    .split("\u0000")
    .splice(1);
}

export default async function HandleAuth(
  socket: WebSocket,
  accountId: string,
  Authenticated: boolean,
  message: xmlparser.Node
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const parsedMessage = parseMessageContent(message.content);

      const token = Globals.AccessTokens.find(
        (data) => data.accountId === accountId
      );

      if (token && token.token === parsedMessage[1]) {
        accountId = parsedMessage[0];
        Authenticated = true;

        log.log(
          `An XMPP Client with the accountId ${accountId} has logged in.`,
          "HandleAuth",
          "cyanBright"
        );

        Globals.Clients[accountId] = {
          accountId,
          token: accountId,
          wss: socket,
        };

        // console.debug(Globals.Clients);

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
