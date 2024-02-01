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

const accountIds: string[] = [];
export let exchangeCodes: any[] = [];
export let clientTokens: any[] = [];
export let AccessTokens: AccessToken[] = [];
export let MUCs: { members: any[] } = { members: [] };
export let refreshTokens: any[] = [];

export const Globals = {
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
  accountIds,
};
