import WebSocket from "ws";

let ConnectedClients = new Map<string, WebSocket>();
let Received = "";
let resource: string = "";
let clientExists: boolean = false;

export const Saves = {
  ConnectedClients,
  Received,
  resource,
  clientExists,
};
