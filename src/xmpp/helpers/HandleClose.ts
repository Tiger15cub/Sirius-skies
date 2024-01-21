import WebSocket from "ws";
import log from "../../utils/log";
import { DateTime } from "luxon";
import xmlbuilder from "xmlbuilder";
import { Globals } from "../types/XmppTypes";
import { Saves } from "../types/Saves";
import { v4 as uuid } from "uuid";
import { findInIterable } from "../functions/findInIterable";
import { addOrUpdateClient } from "../functions/addOrUpdateClient";

export default {
  handleClose(socket: WebSocket) {
    Saves.clientExists = false;
    Saves.activeConnection = false;
    Saves.ConnectedClients.delete(Globals.UUID);

    const clientArray = Array.from(Globals.Clients);
    const clientIndex = clientArray.findIndex(
      (client) => client.socket === socket
    );

    if (clientIndex !== -1) {
      const removedClients = clientArray.splice(clientIndex, 1);
      addOrUpdateClient(Globals.Clients, removedClients[0]);
    }

    const client = findInIterable(
      Globals.Clients,
      (client) => client.socket === socket
    );

    if (!client) {
      log.debug(JSON.stringify(Globals.Clients), "HandleClients");
      log.debug(JSON.stringify(client), "HandleClose");
      log.error("Connection does not exist.", "HandleClose");
      return;
    }

    // Globals.Clients.delete({
    //   accountId: Globals.accountId,
    // });

    // Debug
    log.debug(JSON.stringify(socket), "HandleClose");

    const status = JSON.parse(client.lastPresenceUpdate?.status as string);
    let selectedPartyId: string | undefined = "";

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

    const { Properties } = status;

    if (Properties) {
      for (const key in Properties) {
        const PartyJoinInfo = key.toLowerCase().startsWith("party.joininfo");

        if (PartyJoinInfo && Properties[key]) {
          selectedPartyId = Properties[key].partyId;
          break;
        }
      }
    }

    if (selectedPartyId) {
      const sender = client.accountId;

      for (const { accountId, jid, socket } of Globals.Clients) {
        if (sender !== accountId) {
          const id = uuid().replace(/-/g, "").toUpperCase();

          socket?.send(
            xmlbuilder
              .create("message")
              .attribute("id", id)
              .attribute("from", client.jid)
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
    }

    log.custom(
      `XMPP Client with the displayName ${client.displayName} has logged out.`,
      "XMPP"
    );
  },
};
