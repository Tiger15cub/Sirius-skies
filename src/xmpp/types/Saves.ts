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
};
