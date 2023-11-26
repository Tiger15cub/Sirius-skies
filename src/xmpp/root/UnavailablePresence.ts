import xmlbuilder from "xmlbuilder";
import Users from "../../models/Users";
import log from "../../utils/log";

function GeneratePayload(client: any, toFriend: string): string {
  const payload = xmlbuilder
    .create({
      presence: {
        "@xmlns": "jabber:client",
        "@to": toFriend,
        "@from": client.jid,
        "@type": "unavailable",
        status: {
          "#text": {
            bHasVoiceSupport: false,
            bIsJoinable: false,
            bIsPlaying: false,
            Properties: {
              bInPrivate: true,
            },
            SessionId: "",
            Status: "Playing Battle Royale - 1 / 16",
          },
        },
      },
    })
    .end()
    .replace(`<?xml version="1.0"?>`, "")
    .trim();

  return payload;
}

function sendPayload(client: any, payload: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (Globals.Clients[client.accountId]) {
      Globals.Clients[client.accountId].wss.socket.send(payload);
      resolve();
    } else {
      reject(new Error("Client not found"));
    }
  });
}

export async function SendUnavailablePresence(
  client: any,
  toFriend: string
): Promise<void> {
  try {
    const user = await Users.findOne({ accountId: client.accountId }).lean();

    if (!user) {
      return;
    }

    const payload = GeneratePayload(client, toFriend);
    await sendPayload(client, payload);
  } catch (error) {
    log.error(
      `Error sending unavailable presence: ${error}`,
      "UnavailablePresence"
    );
    throw error;
  }
}
