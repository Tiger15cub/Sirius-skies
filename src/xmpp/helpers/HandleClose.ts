import WebSocket from "ws";
import log from "../../utils/log";
import { DateTime } from "luxon";
import xmlbuilder from "xmlbuilder";
import { Globals } from "../types/XmppTypes";
import { Saves } from "../types/Saves";
import { v4 as uuid } from "uuid";
import updatePresenceForClientFriend from "../functions/updatePresenceForClientFriend";

export default {
  async handleClose(socket: WebSocket) {
    const clientIndex = Globals.Clients.find(
      (client) => client.socket === socket
    );
    const client = Globals.Clients[clientIndex];
    if (clientIndex === -1) return;

    updatePresenceForClientFriend(socket, "{}", false, true);
    Globals.Clients.splice(clientIndex, 1);

    for (let room of Saves.JoinedMUCs) {
      // @ts-ignore
      const MUCRoom = Globals.MUCs[room];

      if (MUCRoom) {
        const MUCMemberIndex = MUCRoom.members.findIndex(
          (member: { accountId: string }) =>
            member.accountId === client.accountId
        );

        if (MUCMemberIndex !== -1) {
          return MUCRoom.members.splice(MUCMemberIndex, 1);
        }
      }
    }

    const status = client?.lastPresenceUpdate?.status;
    let selectedPartyId: string | undefined = "";

    if (status !== undefined) {
      const parsedStatus = JSON.parse(status);

      if (typeof parsedStatus === "object" && parsedStatus !== null) {
        const { Properties } = parsedStatus!;

        if (Properties) {
          for (const key in Properties) {
            const PartyJoinInfo = key
              .toLowerCase()
              .startsWith("party.joininfo");

            if (Properties[key].partyId === "") {
              return log.error(
                `Property 'partyId' is undefined`,
                "HandleClose"
              );
            }

            if (PartyJoinInfo && Properties[key]) {
              selectedPartyId = Properties[key].partyId;
              break;
            }
          }
        }
      } else {
        log.error(`Invalid JSON Format: ${status}`, "HandleClose");
      }
    }

    const sender = client?.accountId;

    for (const { accountId, jid, socket } of Globals.Clients) {
      if (sender !== accountId) {
        const id = uuid().replace(/-/g, "").toUpperCase();
        console.log(`partyId: ${selectedPartyId}`);

        socket?.send(
          xmlbuilder
            .create("message")
            .attribute("id", id)
            .attribute("from", client?.jid)
            .attribute("xmlns", "jabber:client")
            .attribute("to", jid)
            .element(
              "body",
              JSON.stringify({
                type: "com.epicgames.party.memberexited",
                payload: {
                  partyId: selectedPartyId!,
                  memberId: sender,
                  wasKicked: false,
                },
                timestamp: DateTime.now().toISO(),
              })
            )
            .up()
            .toString()
        );
      }
    }
  },
};
