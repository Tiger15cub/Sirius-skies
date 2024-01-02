import WebSocket from "ws";

export let ConnectedClients = new Map<string, WebSocket>();
export let Received = "";
