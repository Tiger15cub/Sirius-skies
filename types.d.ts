interface AccessToken {
  accountId: string;
  token: string;
}

interface Clients extends AccessToken {
  accountId: string;
  token: string;
  wss: Client;
}

namespace Globals {
  export const exchangeCodes: Record<string, any> = {};
  export const clientTokens: any[] = [];
  export const AccessTokens: AccessToken[] = [];
  export const Clients: Record<string, Clients> = {};
  export const MUCs: Record<string, any> = {};
  export const parties: any[] = [];
  export const invites: any[] = [];
  export const pings: any[] = [];
}
