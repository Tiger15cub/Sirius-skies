import WebSocket from "ws";
import xmlbuilder from "xmlbuilder";
import xmlparser from "xml-parser";
import { Globals } from "../types/XmppTypes";
import Users from "../../models/Users";
import log from "../../utils/log";
import { Saves } from "../types/Saves";
import { findInIterable } from "../functions/findInIterable";
import { addOrUpdateClient } from "../functions/addOrUpdateClient";

export default async function auth(
  socket: WebSocket,
  document: xmlparser.Node,
  id: string
): Promise<void> {
  let response: string = "";
  let buffer: Buffer;

  if (!id) {
    await socket.close();
    return;
  }

  const decodedBytes = Buffer.from(document.content as string, "base64");
  const decodedContent = decodedBytes.toString("utf-8");
  const authFields = decodedContent.split("\u0000");

  const accessToken = Globals.AccessTokens.find(
    (token) => token.token === authFields[2]
  );

  if (!accessToken) {
    await socket.close();
    return;
  }

  const existingClient = findInIterable(
    Globals.Clients,
    (client) => client.accountId === Globals.accountId
  );

  if (existingClient) {
    await socket.close();
    return;
  }

  const user = await Users.findOne({ accountId: accessToken.accountId }).lean();

  if (!user) {
    await socket.close();
    return;
  }

  if (user.banned) {
    await socket.close();
    Globals.isAuthenticated = false;
    return;
  }

  Globals.accountId = user.accountId;
  Globals.token = accessToken.token;
  Globals.displayName = user.username;

  if (
    decodedContent !== "" &&
    Globals.accountId !== "" &&
    Globals.displayName !== "" &&
    Globals.token !== "" &&
    authFields.length === 3
  ) {
    Globals.isAuthenticated = true;

    log.custom(
      `XMPP Client with the displayName ${Globals.displayName} has logged in.`,
      "XMPP"
    );

    addOrUpdateClient(Globals.Clients, {
      accountId: Globals.accountId,
      displayName: Globals.displayName,
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
    log.error("Password not verified.", "Auth");
  }
}
