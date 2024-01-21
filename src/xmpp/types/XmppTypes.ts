import { v4 as uuid } from "uuid";
import WebSocket from "ws";
import { Saves } from "./Saves";

export interface AccessToken {
  accountId: string;
  token: string;
}

export interface XmppClients extends AccessToken {
  accountId: string;
  displayName?: string;
  jid?: string;
  resource?: string;
  token: string;
  lastPresenceUpdate?: {
    away: boolean;
    status: string;
  };
  socket?: WebSocket;
}

export let UUID: string = uuid();
export let accountId: string = "";
export let isAuthenticated: boolean = false;
export let token: string = "";
export let jid: string = "";
export let displayName: string = "";

const clientPropertyKeys: Set<string> = new Set([
  "accountId",
  "isAuthenticated",
  "token",
  "jid",
  "displayName",
]);

export let clientProperties: Set<string> = new Set(clientPropertyKeys);

export interface Globals {
  exchangeCodes: any[];
  clientTokens: any[];
  AccessTokens: AccessToken[];
  Clients: Set<XmppClients>;
  refreshTokens: any[];
  MUCs: { members: any[] };
  UUID: string;
  isAuthenticated: boolean;
  accountId: string;
  token: string;
  jid: string;
  displayName: string;
}

export let exchangeCodes: Globals["exchangeCodes"] = [];
export let clientTokens: Globals["clientTokens"] = [];
export let AccessTokens: Globals["AccessTokens"] = [];
export let Clients: Globals["Clients"] = new Set([
  {
    accountId,
    displayName,
    token,
    resource: Saves.resource,
    lastPresenceUpdate: {
      away: false,
      status: "{}",
    },
  },
]);
export let MUCs: Globals["MUCs"] = { members: [] };
export let refreshTokens: Globals["refreshTokens"] = [];

export const Globals: Globals = {
  exchangeCodes,
  clientTokens,
  AccessTokens,
  Clients,
  MUCs,
  UUID,
  isAuthenticated,
  accountId,
  token,
  jid,
  refreshTokens,
  displayName,
};
