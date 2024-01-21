import WebSocket from "ws";
import xmlbuilder from "xmlbuilder";

export default function sendPresenceUpdate(
  socket: WebSocket,
  to: string,
  from: string,
  status: string | undefined,
  showAway: boolean
): void {
  const presence = xmlbuilder
    .create("presence")
    .attribute("to", to)
    .attribute("xmlns", "jabber:client")
    .attribute("from", from)
    .attribute("type", "available");

  if (showAway) {
    presence.element("show", "away").up();
  }

  if (status) {
    presence.element("status", status).up();
  }

  socket.send(presence.toString());
}
