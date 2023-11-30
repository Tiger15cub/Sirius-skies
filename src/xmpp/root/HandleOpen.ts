import WebSocket from "ws";
import xmlbuilder from "xmlbuilder";
import SendFeatures from "../helpers/SendFeatures";

export default function HandleOpen(
  socket: WebSocket,
  uuid: string,
  Authenticated: boolean
): void {
  socket.send(
    xmlbuilder
      .create("open")
      .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-framing")
      .attribute("from", "prod.ol.epicgames.com")
      .attribute("id", uuid)
      .attribute("version", "1.0")
      .attribute("xml:lang", "en")
      .toString()
  );

  SendFeatures(Authenticated, socket);
}
