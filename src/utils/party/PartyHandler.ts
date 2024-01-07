import crypto from "node:crypto";
import { Saves } from "../../xmpp/types/Saves";
import { DateTime } from "luxon";
import { Globals } from "../../xmpp/types/XmppTypes";
import xmlbuilder from "xmlbuilder";
import log from "../log";

interface Connection {
  id: string;
  meta: { [key: string]: any };
}

export default class PartyHandler {
  private static id: string = "";

  constructor() {
    PartyHandler.id = crypto.randomBytes(16).toString("hex");
  }

  static createParty() {
    const party = {
      id: this.id,
      privacy: "OPEN",
      members: Saves.members.map((member) => member.account_id),
    };

    Saves.parties.push(party);

    return party;
  }

  static updateParty(partyId: string) {
    const partyIndex = Saves.parties.findIndex((party) => party.id === partyId);

    if (partyIndex !== -1) {
      const updatedParty = {
        id: partyId,
        members: Saves.members.map((member) => member.account_id),
        party: Saves.parties[partyIndex],
      };

      Saves.parties.splice(partyIndex, 1, updatedParty);
    } else {
      log.error(`Party with the id ${partyId} was not found.`, "PartyHandler");
      return;
    }
  }

  static addMemberToParty(connection: Connection) {
    const account_id = connection.id.split("@")[0];
    const meta = {
      "urn:epic:member:dn_s": connection.meta["urn:epic:member:dn_s"],
    };

    const newMember = {
      account_id,
      meta,
      connections: [
        {
          id: connection.id,
          connected_at: DateTime.now().toISO(),
          updated_at: DateTime.now().toISO(),
          yield_leadership: false,
          meta: connection.meta,
        },
      ],
      revision: 0,
      joined_at: DateTime.now().toISO(),
      updated_at: DateTime.now().toISO(),
      role: "CAPTAIN",
    };

    Saves.members.push([newMember]);

    return newMember;
  }

  static sendXmppMessageToClient(data: string) {
    Saves.members.forEach((member) => {
      const client = Globals.Clients[member.account_id];
      const socket = client.socket;

      if (socket) {
        socket.send(data);
      }
    });
  }
}
