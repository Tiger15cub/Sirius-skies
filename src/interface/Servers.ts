export interface ServerElement {
  serverAddress: string;
  serverPort: number;
  playlist: string;
  maxPlayers: number;
}

export interface Servers {
  eu: ServerElement[];
  nae: ServerElement[];
}
