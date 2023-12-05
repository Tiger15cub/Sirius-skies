export interface ServerElement {
  serverAddress: string;
  serverPort: number;
  playlist: string;
  maxPlayers: number;
  sessionId: string;
  region: string;
}

export interface Servers {
  eu: ServerElement[];
  nae: ServerElement[];
}
