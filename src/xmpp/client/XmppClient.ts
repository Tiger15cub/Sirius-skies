import { EventEmitter } from "node:events";
import WebSocket, { RawData } from "ws";
import { v4 as uuid } from "uuid";
import xmlparser from "xml-parser";
import HandleOpen from "../root/HandleOpen";
import log from "../../utils/log";
import HandleAuth from "../root/HandleAuth";

export default class XmppClient extends EventEmitter {
  public jid: string;
  public socket: WebSocket;
  public accountId: string;
  public Authenticated: boolean;
  public ConnectedToParty: boolean;
  private uuid: string;
  public sender?: string;

  constructor(ws: WebSocket) {
    super();

    this.jid = "";
    this.socket = ws;
    this.accountId = "";
    this.Authenticated = false;
    this.ConnectedToParty = false;
    this.sender = "";
    this.uuid = uuid();

    this.socket.on("message", async (message: RawData | string) => {
      if (Buffer.isBuffer(message)) message = message.toString();

      const parsedMessage = xmlparser(message as string);

      if (!parsedMessage || !parsedMessage.root || !parsedMessage.root.name)
        return log.error(
          `WebSocket Error: ${JSON.stringify(parsedMessage)}`,
          "XmppClient"
        );

      const { root } = parsedMessage;

      switch (root.name) {
        case "open":
          this.Open();
          break;
        case "auth":
          this.Auth(root);
          break;
      }
    });
  }

  Open() {
    HandleOpen(this.socket, this.uuid, this.Authenticated);
  }

  Auth(parsedMessage: xmlparser.Node) {
    HandleAuth(
      this.socket,
      this,
      this.accountId,
      this.Authenticated,
      parsedMessage
    );
  }
}
