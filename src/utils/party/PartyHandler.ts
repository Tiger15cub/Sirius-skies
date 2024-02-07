import crypto from "node:crypto";
import { Saves } from "../../xmpp/types/Saves";
import { DateTime } from "luxon";
import { Globals } from "../../xmpp/types/XmppTypes";
import xmlbuilder from "xmlbuilder";
import log from "../log";
import sendXmppMessageToClient from "../sendXmppMessageToClient";
import { v4 as uuid } from "uuid";

interface Connection {
  id: string;
  meta: { [key: string]: any };
}

interface JoinInfo {
  meta: { [key: string]: any };
}

export default class PartyHandler {
  static id: string = "";
  private static meta: any = {};
  static revision: number = 0;

  constructor(JoinInfoConnection: Connection, JoinInfo: JoinInfo, meta: any) {
    PartyHandler.id = uuid().replace(/-/g, "");
    PartyHandler.meta = meta;

    Saves.members.push([
      {
        account_id: JoinInfoConnection.id.split("@")[0],
        meta: {
          "urn:epic:member:dn_s": JoinInfo.meta["urn:epic:member:dn_s"],
        },
        connections: [
          {
            id: JoinInfoConnection.id,
            connected_at: DateTime.now().toISO(),
            updated_at: DateTime.now().toISO(),
            yield_leadership: false,
            meta: JoinInfoConnection.meta,
          },
        ],
        revision: 0,
        updated_at: DateTime.now().toISO(),
        joined_at: DateTime.now().toISO(),
        role: "CAPTAIN",
      },
    ]);

    Saves.parties.push({
      id: PartyHandler.id,
      privacy: "PUBLIC",
      members: Saves.members.map((member) => member.account_id),
      party: PartyHandler,
    });

    this.notify(JoinInfoConnection, JoinInfo);
  }

  private notify(JoinInfoConnection: Connection, JoinInfo: JoinInfo) {
    const accountId = JoinInfoConnection.id.split("@")[0];
    const member = Saves.members.find((m) => m.account_id === accountId);
    PartyHandler.revision += 1;

    const client = (global as any).Clients.find(
      (clien: any) => client.accountId === accountId
    );

    if (!client) {
      log.error(
        `Failed to find client with the accountId: ${accountId}`,
        "PartyHandler"
      );
      return;
    }

    if (!client.socket) {
      log.error("Socket not found.", "PartyHandler");
      return;
    }

    if (client) {
      sendXmppMessageToClient(
        JSON.stringify({
          account_dn: JoinInfo.meta["urn:epic:member:dn_s"],
          account_id: accountId,
          connection: {
            connected_at: DateTime.now().toISO(),
            id: JoinInfoConnection.id.split("@"),
            meta: JoinInfoConnection.meta,
            updated_at: DateTime.now().toISO(),
            joined_at: DateTime.now().toISO(),
          },
          member_state_update: {
            "urn:epic:member:dn_s": JoinInfo.meta["urn:epic:member:dn_s"],
          },
          ns: "Fortnite",
          party_id: PartyHandler.id,
          revision: PartyHandler.revision,
          sent: DateTime.now().toISO(),
          type: "com.epicgames.social.party.notification.v0.MEMBER_JOINED",
          updated_at: DateTime.now().toISO(),
        }),
        accountId
      );
    }
  }

  static createParty() {
    const party = {
      id: PartyHandler.id,
      privacy: "OPEN",
      members: Saves.members.map((member) => member.account_id),
      party: PartyHandler,
    };

    Saves.parties.push(party);

    return party;
  }

  static getCaptain(): string {
    const captain = Saves.members.find((member) => member.role === "CAPTAIN");

    if (!captain) {
      log.error("Captain not found.", "getCaptain");
      return "Captain not found.";
    }

    return captain.account_id;
  }

  static setLeader(accountId: string) {
    const captain = Saves.members.find(
      (member) => member.account_id === PartyHandler.getCaptain()
    );
    const member = Saves.members.find(
      (member) => member.account_id === accountId
    );

    const captainIndex = Saves.members.findIndex(
      (member) => member.account_id === PartyHandler.getCaptain()
    );
    const memberIndex = Saves.members.findIndex(
      (member) => member.account_id === accountId
    );

    if (captain && member) {
      captain.role = "MEMBER";
      member.role = "CAPTAIN";

      Saves.members.splice(captainIndex, 1, captain);
      Saves.members.splice(memberIndex, 1, member);
    }

    sendXmppMessageToClient(
      JSON.stringify({
        account_id: accountId,
        member_state_update: {},
        ns: "Fortnite",
        party_id: PartyHandler.id,
        revision: 0,
        sent: DateTime.now().toISO(),
        type: "com.epicgames.social.party.notification.v0.MEMBER_NEW_CAPTAIN",
      }),
      accountId
    );
  }

  static updatePartyMember(
    meta: {
      update: Record<string, any>;
      delete: string[];
    },
    accountId: string,
    partyId: string
  ) {
    Object.assign(this.meta, meta.update);
    meta.delete.forEach((key: string) => delete this.meta[key]);

    const party = Saves.parties[Number(partyId)];

    sendXmppMessageToClient(
      JSON.stringify({
        captain_id: PartyHandler.getCaptain(),
        created_at: DateTime.now().toISO(),
        invite_ttl_seconds: 14400,
        max_number_of_members: 16,
        ns: "Fortnite",
        party_id: party.id,
        party_privacy_type: "PUBLIC",
        party_state_overriden: {},
        party_state_removed: meta.delete,
        party_state_updated: meta.update,
        party_sub_type: "default",
        party_type: "DEFAULT",
        revision: party.revision,
        sent: DateTime.now().toISO(),
        type: "com.epicgames.social.party.notification.v0.PARTY_UPDATED",
        updated_at: DateTime.now().toISO(),
      }),
      accountId
    );
  }

  static updateParty(partyId: string, accountId: string) {
    const partyIndex = Saves.parties.findIndex(
      (party) =>
        party.members.findIndex(
          (member: { account_id: string }) => member.account_id === accountId
        ) !== -1
    );

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
}
