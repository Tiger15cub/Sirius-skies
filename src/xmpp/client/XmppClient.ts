import { EventEmitter } from "node:events";
import WebSocket, { RawData } from "ws";
import { v4 as uuid } from "uuid";
import xmlparser from "xml-parser";
import xmlbuilder from "xmlbuilder";
import HandleOpen from "../root/HandleOpen";
import log from "../../utils/log";

type MethodHandler = (message: any) => void;

interface MethodHandlers {
  [key: string]: MethodHandler;
}

export default class XmppClient extends EventEmitter {
  public jid: string;
  public socket: WebSocket;
  public accountId: string;
  public Authenticated: boolean;
  public ConnectedToParty: boolean;
  private uuid: string;
  public sender?: string;
  private handlers: MethodHandlers;

  constructor(ws: WebSocket) {
    super();

    this.jid = "";
    this.socket = ws;
    this.accountId = "";
    this.Authenticated = false;
    this.ConnectedToParty = false;
    this.sender = "";
    this.uuid = uuid();

    this.handlers = {
      handleopen: this.Open.bind(this),
    };

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
      }
    });
  }

  Open() {
    HandleOpen(this.socket, this.uuid, this.Authenticated);
  }
}
