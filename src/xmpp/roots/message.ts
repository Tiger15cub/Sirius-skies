import WebSocket from "ws";
import xmlparser from "xml-parser";

export default async function message(
  socket: WebSocket,
  document: xmlparser.Node,
  id: string
) {
  if (!id) {
    await socket.close();
    return;
  }

  const body = document.children.find(
    (child) => child.name === "body"
  )?.content;

  switch (body) {
    case "chat":
      break;

    case "groupchat":
      break;

      
  }
}
