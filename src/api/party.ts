import { Router, application } from "express";
import { DateTime } from "luxon";
import crypto from "node:crypto";
import { Saves } from "../xmpp/types/Saves";
import { Globals, UUID } from "../xmpp/types/XmppTypes";
import xmlbuilder from "xmlbuilder";
import PartyHandler from "../utils/party/PartyHandler";
import VivoxTokenGenerator from "../utils/voicechat/vivox";
import { getEnv } from "../utils";
import os from "node:os";
import axios from "axios";
import verifyToken from "../middleware/verifyToken";

export default function initRoute(router: Router) {
  router.get("/party/api/v1/Fortnite/parties", async (req, res) => {
    const { join_info: JoinInfo, config, meta } = req.body;
    const { connection: JoinInfoConnection } = JoinInfo;

    new PartyHandler(JoinInfoConnection, JoinInfo);

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

      const client = Globals.Clients[accountId as any];
      // new PartyHandler(JoinInfoConnection, JoinInfo);

      PartyHandler.addMemberToParty(connection);
      PartyHandler.updateParty(partyId);
      PartyHandler.sendXmppMessageToClient(
        xmlbuilder
          .create("message")
          .attribute("xmlns", "jabber:client")
          .attribute("to", client.jid)
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

  // router.post(
  //   "/party/api/v1/Fortnite/parties/:partyId/members/:accountId/conferences/connection",
  //   async (req, res, next) => {
  //     const { partyId, accountId } = req.params;

  //     const domain = getEnv("VIVOX_DOMAIN");
  //     const appName = getEnv("VIVOX_APP_NAME");
  //     const deploymentId = getEnv("EOS_DEPLOYMENT_ID");
  //     let { vivox, rtcp } = req.body.providers;

  //     const party = Saves.parties.find((p) => p.id === partyId);
  //     console.log(partyId);
  //     console.log(party.id);

  //     const vivoxToken = new VivoxTokenGenerator(
  //       getEnv("CLIENT_SECRET")
  //     ).generateToken(
  //       appName,
  //       accountId,
  //       `sip:confctl-g-${appName}.p-${party.id}@${domain}`,
  //       `sip:.${appName}.${accountId}.@${domain}`
  //     );

  //     console.log(vivoxToken);

  //     rtcp = {};

  //     vivox = {
  //       authorization_token: vivoxToken,
  //       channel_uri: `sip:confctl-g-${appName}.p-${party.id}@${domain}`,
  //       user_uri: `sip:.${appName}.${accountId}.@${domain}`,
  //     };

  //     console.log(rtcp);
  //     console.log(vivox);

  //     res.json({
  //       providers: {
  //         rtcp,
  //         vivox,
  //       },
  //     });
  //   }
  // );
}
