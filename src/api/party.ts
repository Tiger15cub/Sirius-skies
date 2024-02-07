import { Router, Request, Response, NextFunction } from "express";
import { DateTime } from "luxon";
import { Saves } from "../xmpp/types/Saves";
import { Globals } from "../xmpp/types/XmppTypes";
import PartyHandler from "../utils/party/PartyHandler";
import VivoxTokenGenerator from "../utils/voicechat/vivox";
import { getEnv } from "../utils";
import verifyToken from "../middleware/verifyToken";
import sendXmppMessageToClient from "../utils/sendXmppMessageToClient";
import log from "../utils/log";

export default function initRoute(router: Router) {
  router.post(
    "/party/api/v1/Fortnite/parties",
    verifyToken,
    async (req: Request, res: Response) => {
      try {
        const { join_info: JoinInfo, config, meta } = req.body;
        const { connection: JoinInfoConnection } = JoinInfo;

        new PartyHandler(JoinInfoConnection, JoinInfo, meta);

        const newMember = PartyHandler.addMemberToParty(JoinInfoConnection);
        const newParty = PartyHandler.createParty();

        const party = {
          id: newParty.id,
          created_at: DateTime.now().toISO(),
          updated_at: DateTime.now().toISO(),
          config,
          members: [
            {
              account_id: newMember.account_id,
              meta: {
                meta: JoinInfo.meta || {},
                connections: [
                  {
                    id: JoinInfoConnection.id || "",
                    connected_at: DateTime.now().toISO(),
                    updated_at: DateTime.now().toISO(),
                    yield_leadership: false,
                    meta: JoinInfoConnection.meta || {},
                  },
                ],
                revision: 0,
                updated_at: DateTime.now().toISO(),
                joined_at: DateTime.now().toISO(),
                role: "CAPTAIN",
              },
            },
          ],
          applicants: [],
          meta,
          invites: [],
          revision: 0,
          intentions: [],
        };

        Saves.parties[Number(party.id)] = party;
        res.json(party);
      } catch (error) {
        log.error(`Error: ${error}`, "Party");
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  router.get(
    "/party/api/v1/Fortnite/user/:accountId",
    verifyToken,
    async (req: Request, res: Response) => {
      try {
        const { accountId } = req.params;

        const currentParty = Saves.parties.find(
          (party) =>
            party.members.findIndex(
              (member: { account_id: string }) =>
                member.account_id === accountId
            ) !== -1
        );
        const currentPings = Saves.pings.find((ping) => ping.id === accountId);

        res.json({
          current: currentParty ? [currentParty] : [],
          pending: [],
          invites: [],
          pings: currentPings ? [currentPings] : [],
        });
      } catch (error) {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  router.post(
    "/party/api/v1/Fortnite/parties/:partyId/members/:accountId/join",
    verifyToken,
    async (req: Request, res: Response) => {
      try {
        const { partyId, accountId } = req.params;
        const { connection, meta, join_info: JoinInfo } = req.body;

        const clientIndex = (global as any).Clients.findIndex(
          (client: any) => client.accountId === accountId
        );

        if (clientIndex === -1)
          return res.status(404).json({ message: "Client not found" });

        const client = (global as any).Clients[clientIndex];

        const captain = Saves.members.find(
          (member) => member.role === "CAPTAIN"
        );
        new PartyHandler(connection, JoinInfo, meta);

        // Should work fine
        const party = Saves.parties[Number(partyId)];

        party.members.push({
          account_id: connection.id.split("@prod")[0],
          meta: meta || {},
          connections: [
            {
              id: connection.id || "",
              connected_at: DateTime.now().toISO(),
              updated_at: DateTime.now().toISO(),
              yield_leadership: connection.yield_leadership ? true : false,
              meta: connection.meta || {},
            },
          ],
          revision: 0,
          updated_at: DateTime.now().toISO(),
          joined_at: DateTime.now().toISO(),
          role: connection.yield_leadership ? "CAPTAIN" : "MEMBER",
        });

        const assign = party.meta["Default:RawSquadAssignments_j"]
          ? "Default:RawSquadAssignments_j"
          : "RawSquadAssignments_j";

        const RawSquadAssignment = JSON.parse(party.meta[assign]);

        RawSquadAssignment.RawSquadAssignments.push({
          memberId: connection.id.split("@prod")[0],
          absoluteMemberIndex: party.members.length - 1,
        });

        party.meta[assign] = JSON.stringify(RawSquadAssignment);
        party.revision++;
        party.updated_at = DateTime.now().toISO();

        PartyHandler.addMemberToParty(connection);
        PartyHandler.updateParty(partyId, client.accountId);
        sendXmppMessageToClient(
          JSON.stringify({
            account_dn: connection.meta["urn:epic:member:dn_s"],
            account_id: connection.id.split("@")[0],
            connection: {
              connected_at: DateTime.now().toISO(),
              id: connection.id,
              meta: connection.meta,
              updated_at: DateTime.now().toISO(),
            },
            joined_at: DateTime.now().toISO(),
            member_state_updated: meta,
            ns: "Fortnite",
            party_id: partyId,
            revision: 0,
            sent: DateTime.now().toISO(),
            type: "com.epicgames.social.party.notification.v0.MEMBER_JOINED",
            updated_at: DateTime.now().toISO(),
          }),
          client.accountId
        );

        sendXmppMessageToClient(
          JSON.stringify({
            captain_id: captain.account_id,
            created_at: party.id,
            invite_ttl_seconds: 14400,
            max_number_of_members: 16,
            ns: "Fortnite",
            party_id: party.id,
            party_privacy_type: "PUBLIC",
            party_state_overriden: {},
            party_state_removed: [],
            party_state_updated: ["Default:RawSquadAssignments_j"],
            party_sub_type: "default",
            party_type: "DEFAULT",
            revision: party.revision,
            sent: DateTime.now().toISO(),
            type: "com.epicgames.social.party.notification.v0.PARTY_UPDATED",
            updated_at: DateTime.now().toISO(),
          }),
          client.accountId
        );

        res.json({
          status: "JOINED",
          party_id: partyId,
        });
      } catch (error) {
        log.error(`JoinError: ${error}`, "Party");
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  router.patch(
    "/party/api/v1/Fortnite/parties/:partyId",
    verifyToken,
    async (req: Request, res: Response) => {
      try {
        const { partyId } = req.params;
        const { meta } = req.body;
        const party = Saves.parties.find((party) => party.id === partyId);

        if (!party) {
          return res.status(404).json({
            errorCode: "errors.com.epicgames.social.party.party_not_found",
            errorMessage: `The user ${res.locals.user.accountId} has no right to make changes to party ${partyId}`,
            numericErrorCode: 51015,
            originatingService: "any",
            intent: "prod",
            error_description: `The user ${res.locals.user.accountId} has no right to make changes to party ${partyId}`,
            error: "party",
          });
        }

        PartyHandler.updatePartyMember(
          meta,
          res.locals.user.accountId,
          partyId
        );
        res.status(204).send();
      } catch (error) {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  router.post(
    "/party/api/v1/Fortnite/user/:accountId/pings/:pingerId",
    verifyToken,
    async (req: Request, res: Response) => {
      try {
        const { accountId, pingerId } = req.params;
        const ping = Saves.pings.find(
          (ping) => ping.sent_to === accountId && ping.sent_by === pingerId
        );

        Saves.pings.push({
          sent_by: pingerId,
          sent_to: accountId,
          sent_at: DateTime.now().toISO(),
          expires_at: DateTime.now().plus({ hours: 1 }).toISO(),
          meta: {},
        });

        const clientIndex = (global as any).Clients.findIndex(
          (client: any) => client.accountId === accountId
        );

        if (clientIndex === -1)
          return res.status(404).json({ message: "Client not found" });

        const client = (global as any).Clients[clientIndex];

        sendXmppMessageToClient(
          {
            expires: ping.expires_at,
            meta: {},
            ns: "Fortnite",
            pinger_dn: client.displayName,
            pinger_id: pingerId,
            sent: ping.sent_at,
            type: "com.epicgames.social.party.notification.v0.PING",
          },
          client.accountId
        );

        res.status(204).json(ping);
      } catch (error) {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  router.post(
    "/party/api/v1/Fortnite/parties/:partyId/members/:accountId/promote",
    verifyToken,
    async (req: Request, res: Response) => {
      try {
        const { partyId, accountId } = req.params;

        PartyHandler.setLeader(accountId);
        res.status(204).send();
      } catch (error) {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  router.post(
    "/party/api/v1/Fortnite/parties/:partyId/members/:accountId/conferences/connection",
    verifyToken,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { partyId, accountId } = req.params;

        const domain = getEnv("VIVOX_DOMAIN");
        const appName = getEnv("VIVOX_APP_NAME");
        let { vivox, rtcp } = req.body.providers;

        const party = Saves.parties.find((p) => p.id === partyId);

        const vivoxToken = await new VivoxTokenGenerator(
          getEnv("CLIENT_SECRET")
        ).generateToken(
          appName,
          accountId,
          `sip:confctl-g-${appName}.p-${party.id}@${domain}`,
          `sip:.${appName}.${accountId}.@${domain}`,
          "join"
        );

        rtcp = {};
        // memory leak???
        // new EOSVoiceChat(config);

        vivox = {
          authorization_token: vivoxToken,
          channel_uri: `sip:confctl-g-${appName}.p-${party.id}@${domain}`,
          user_uri: `sip:.${appName}.${accountId}.@${domain}`,
        };

        res.json({
          providers: {
            rtcp,
            vivox,
          },
        });
      } catch (error) {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );
}
