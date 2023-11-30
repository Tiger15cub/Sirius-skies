import { EventEmitter } from "node:events";
import WebSocket, { RawData } from "ws";
import { v4 as uuid } from "uuid";
import xmlparser from "xml-parser";
import HandleOpen from "../root/HandleOpen";
import log from "../../utils/log";
import HandleAuth from "../root/HandleAuth";
import HandleIQ from "../root/HandleIQ";
import HandleMessage from "../root/HandleMessage";
import HandlePresence from "../root/HandlePresence";
import HandleClose from "../root/HandleClose";

export default class XmppClient extends EventEmitter {
  public jid: string;
  public socket: WebSocket;
  public accountId: string;
  public Authenticated: boolean;
  private uuid: string;
  public sender?: NodeJS.Timeout;
  public displayName: string;
  public token: string;

  constructor(ws: WebSocket) {
    super();

    this.jid = "";
    this.socket = ws;
    this.accountId = "";
    this.displayName = "";
    this.token = "";
    this.Authenticated = false;
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
          await this.Open();
          break;
        case "auth":
          await this.Auth(root);
          break;
        case "iq":
          await this.IQ(root);
          break;
        case "message":
          await this.Message(root);
          break;
        case "presence":
          await this.Presence(root);
          break;

        default:
          break;
      }
    });

    this.socket.on("close", async () => {
      await this.Close();
    });
  }

  async Open() {
    await HandleOpen(this.socket, this.uuid, this.Authenticated);
  }

  async Auth(parsedMessage: xmlparser.Node) {
    await HandleAuth(
      this.socket,
      this,
      this.accountId,
      this.displayName,
      this.Authenticated,
      parsedMessage,
      this.token
    );
  }

  async IQ(parsedMessage: xmlparser.Node) {
    await HandleIQ(this.socket, this.accountId, this.jid, parsedMessage);
  }

  async Message(parsedMessage: xmlparser.Node) {
    await HandleMessage(this.socket, this.jid, parsedMessage);
  }

  async Presence(parsedMessage: xmlparser.Node) {
    await HandlePresence(
      this.socket,
      parsedMessage,
      this.accountId,
      this.jid,
      this.sender as NodeJS.Timeout
    );
  }

  async Close() {
    await HandleClose(this.socket);
  }
}
