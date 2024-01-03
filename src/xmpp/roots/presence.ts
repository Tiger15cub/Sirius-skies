import WebSocket from "ws";
import xmlbuilder from "xmlbuilder";
import xmlparser from "xml-parser";
import log from "../../utils/log";

export default async function presence(
  socket: WebSocket,
  document: xmlparser.Node,
  id: string
): Promise<void> {
  if (!id) {
    await socket.close();
    return;
  }

  const rootType = document.attributes.type;

  switch (rootType) {
    case "unavailable":
      log.custom(`DEBUG: ${rootType}`, "XMPP");

      break;

    default:
      break;
  }
}
