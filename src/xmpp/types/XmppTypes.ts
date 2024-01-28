import { v4 as uuid } from "uuid";
import WebSocket from "ws";
import { Saves } from "./Saves";

export interface AccessToken {
  accountId: string;
  token: string;
}

export let UUID: string = uuid();
export let accountId: string = "";
export let isAuthenticated: boolean = false;
export let token: string = "";
export let jid: string = "";
export let displayName: string = "";
export let clientAdded: boolean = false;
export let Clients: any[] = [];

export interface Globals {
  exchangeCodes: any[];
  clientTokens: any[];
  AccessTokens: AccessToken[];
  Clients: any[];
  refreshTokens: any[];
  MUCs: { members: any[] };
  UUID: string;
  isAuthenticated: boolean;
  accountId: string;
  token: string;
  jid: string;
  displayName: string;
  clientAdded: boolean;
}

export let exchangeCodes: Globals["exchangeCodes"] = [];
export let clientTokens: Globals["clientTokens"] = [];
export let AccessTokens: Globals["AccessTokens"] = [];
export let MUCs: Globals["MUCs"] = { members: [] };
export let refreshTokens: Globals["refreshTokens"] = [];

export const Globals: Globals = {
  exchangeCodes,
  clientTokens,
  AccessTokens,
  MUCs,
  UUID,
  isAuthenticated,
  accountId,
  token,
  jid,
  refreshTokens,
  clientAdded,
  displayName,
  Clients,
};
