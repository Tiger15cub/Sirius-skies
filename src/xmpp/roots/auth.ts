import WebSocket from "ws";
import xmlbuilder from "xmlbuilder";
import xmlparser from "xml-parser";
import { Globals } from "../types/XmppTypes";
import Users from "../../models/Users";
import log from "../../utils/log";
import { Saves } from "../types/Saves";
import jwt from "jsonwebtoken";

export default async function auth(
  socket: WebSocket,
  document: xmlparser.Node,
  id: string
): Promise<void> {
  if (!id) {
    await socket.close();
    return;
  }

  const decodedBytes = Buffer.from(document.content as string, "base64");
  const decodedContent = decodedBytes.toString("utf-8");
  const authFields = decodedContent.split("\u0000");
  const accountId = authFields[1];

  const accessToken = Globals.AccessTokens.find((token) => {
    if (!token) return false;
    var s = jwt.decode(token.token.replace("eg1~", ""))!.sub;
    return s === accountId;
  })!;

  if (
    /*!accessToken ||*/
    (global as any).Clients.some(
      (client: any) => client.accountId === accountId
    )
  ) {
    await socket.close();
    return;
  }

  const user = await Users.findOne({ accountId: accountId }).cacheQuery();

  if (!user || user.banned) {
    await socket.close();
    (socket as any).isAuthenticated = false;
    return;
  }

  (socket as any).accountId = user.accountId;
  if (accessToken) (socket as any).token = accessToken.token;
  (socket as any).displayName = user.username;

  if (
    decodedContent &&
    (socket as any).accountId &&
    (socket as any).displayName &&
    /*(socket as any).token &&*/
    authFields.length === 3
  ) {
    (socket as any).isAuthenticated = true;

    log.custom(
      `XMPP Client with the displayName ${
        (socket as any).displayName
      } has logged in.`,
      "XMPP"
    );

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
