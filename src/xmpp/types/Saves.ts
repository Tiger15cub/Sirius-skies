import WebSocket from "ws";

let ConnectedClients = new Map<string, WebSocket>();
let Received = "";
let resource: string = "";
let clientExists: boolean = false;
let JoinedMUCs: any[] = [];
let members: any[] = [];
let parties: any[] = [];
let pings: any[] = [];
let activeConnection: boolean = false;
const GlobalClients = new Map();
const activeAccountIds = new Set();
const blacklistedAccounts = new Set();
const blacklistedSockets = new Set();
const blacklistedAccountIds: Set<string> = new Set();

export const Saves = {
  ConnectedClients,
  Received,
  resource,
  clientExists,
  JoinedMUCs,
  members,
  parties,
  pings,
  activeConnection,
  GlobalClients,
  activeAccountIds,
  blacklistedAccounts,
  blacklistedSockets,
  blacklistedAccountIds,
};
