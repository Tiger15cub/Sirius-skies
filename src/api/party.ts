import { Router, application } from "express";
import { DateTime } from "luxon";
import { Saves } from "../xmpp/types/Saves";
import { Globals } from "../xmpp/types/XmppTypes";
import xmlbuilder from "xmlbuilder";
import PartyHandler from "../utils/party/PartyHandler";
import VivoxTokenGenerator from "../utils/voicechat/vivox";
import { getEnv } from "../utils";
import verifyToken from "../middleware/verifyToken";
import sendXmppMessageToClient from "../utils/sendXmppMessageToClient";

export default function initRoute(router: Router) {
  router.get("/party/api/v1/Fortnite/parties", async (req, res) => {
    const { join_info: JoinInfo, config, meta } = req.body;
    const { connection: JoinInfoConnection } = JoinInfo;

    new PartyHandler(JoinInfoConnection, JoinInfo, meta);

    const newMember = PartyHandler.addMemberToParty(JoinInfoConnection);
    const newParty = PartyHandler.createParty();
    res.json({
      id: newParty.id,
      created_at: DateTime.now().toISO(),
      updated_at: DateTime.now().toISO(),
      config: {
        type: "DEFAULT",
        joinability: "OPEN",
        discoverability: "ALL",
        sub_type: "default",
        max_size: 16,
        invite_ttl: 14400,
        join_confirmation: true,
        ...config,
      },
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
    });
  });

  router.get("/party/api/v1/Fortnite/user/:accountId", async (req, res) => {
    const { accountId } = req.params;

    const currentParty = Saves.parties.find((party) => party.id === accountId);
    const currentPings = Saves.pings.find((ping) => ping.id === accountId);

    res.json({
      current: currentParty ? [currentParty] : [],
      pending: [],
      invites: [],
      pings: currentPings ? [currentPings] : [],
    });
  });

  router.post(
    "/party/api/v1/Fortnite/parties/:partyId/members/:accountId/join",
    async (req, res) => {
      const { partyId, accountId } = req.params;
      const { connection, meta } = req.body;

      const client = Globals.Clients.find(
        (client) => client.accountId === Globals.accountId
      );
      // new PartyHandler(JoinInfoConnection, JoinInfo);

      PartyHandler.addMemberToParty(connection);
      PartyHandler.updateParty(partyId);
      PartyHandler.sendXmppMessageToClient(
        xmlbuilder
          .create("message")
          .attribute("xmlns", "jabber:client")
          .attribute("to", client?.jid)
          .attribute("from", "xmpp-admin@prod.ol.epicgames.com")
          .attribute("id", Globals.UUID.replace(/-/g, ""))
          .element(
            "body",
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
              // 0 for now
              revision: 0,
              sent: DateTime.now().toISO(),
              type: "com.epicgames.social.party.notification.v0.MEMBER_JOINED",
              updated_at: DateTime.now().toISO(),
            })
          )
          .toString()
      );

      res.json({
        status: "JOINED",
        party_id: partyId,
      });
    }
  );

  router.patch(
    "/party/api/v1/Fortnite/parties/:partyId",
    verifyToken,
    async (req, res) => {
      const { partyId } = req.params;
      const { meta } = req.body;
      const party = Saves.parties.find((party) => party.id === partyId);

      if (!party) {
        return res.status(404).json({
          errorCode: "errors.com.epicgames.social.party.party_not_found",
          errorMessage: `The user ${res.locals.user.accountId} has no right to make changes to party ${partyId}`,
          messageVars: undefined,
          numericErrorCode: 51015,
          originatingService: "any",
          intent: "prod",
          error_description: `The user ${res.locals.user.accountId} has no right to make changes to party ${partyId}`,
          error: "party",
        });
      }

      PartyHandler.updatePartyMember(meta, res.locals.user.accountId);
      res.status(204).send();
    }
  );

  router.post(
    "/party/api/v1/Fortnite/user/:accountId/pings/:pingerId",
    verifyToken,
    async (req, res) => {
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

      const client = Globals.Clients.find(
        (client) => client.accountId === accountId
      );

      sendXmppMessageToClient(
        {
          expires: ping.expires_at,
          meta: {},
          ns: "Fortnite",
          pinger_dn: client?.displayName,
          pinger_id: pingerId,
          sent: ping.sent_at,
          type: "com.epicgames.social.party.notification.v0.PING",
        },
        client?.accountId as string
      );

      res.status(204).json(ping);
    }
  );

  router.post(
    "/party/api/v1/Fortnite/parties/:partyId/members/:accountId/promote",
    verifyToken,
    async (req, res) => {
      const { partyId, accountId } = req.params;

      PartyHandler.setLeader(accountId);
      res.status(204).send();
    }
  );

  router.post(
    "/party/api/v1/Fortnite/parties/:partyId/members/:accountId/conferences/connection",
    async (req, res, next) => {
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
    }
  );
}
