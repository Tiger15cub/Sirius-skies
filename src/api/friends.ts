import { Router } from "express";
import { Friend, IFriends, NewFriend } from "../interface";
import { DateTime } from "luxon";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getEnv } from "../utils";
import Friends from "../models/Friends";
import { Globals } from "../xmpp/types/XmppTypes";
import xmlbuilder from "xmlbuilder";
import Accounts from "../models/Accounts";
import Users from "../models/Users";
import sendXmppMessageToClient from "../utils/sendXmppMessageToClient";
import verifyToken from "../middleware/verifyToken";
import log from "../utils/log";

export default function initRoute(router: Router) {
  router.get("/friends/api/public/friends/:accountId", async (req, res) => {
    const { accountId } = req.params;
    const user = await Friends.findOne({ accountId }).lean();

    if (!user) {
      return res.status(404).json({ error: "Failed to find User." });
    }

    const friendsList: Friend[] = [];
    const acceptedFriends = user.friends.accepted;
    const incomingFriends = user.friends.incoming;
    const outgoingFriends = user.friends.outgoing;

    for (const friend of acceptedFriends) {
      friendsList.push({
        accountId: friend.accountId,
        status: "ACCEPTED",
        direction: "OUTBOUND",
        createdAt: DateTime.fromISO(friend.createdAt)
          .toUTC()
          .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
        favorite: false,
      });
    }

    for (const friend of incomingFriends) {
      friendsList.push({
        accountId: friend.accountId,
        status: "PENDING",
        direction: "INBOUND",
        createdAt: DateTime.fromISO(friend.createdAt)
          .toUTC()
          .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
        favorite: false,
      });
    }

    for (const friend of outgoingFriends) {
      friendsList.push({
        accountId: friend.accountId,
        status: "PENDING",
        direction: "OUTBOUND",
        createdAt: DateTime.fromISO(friend.createdAt)
          .toUTC()
          .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
        favorite: false,
      });
    }

    res.json(friendsList);
  });

  router.get("/friends/api/v1/:accountId/summary", async (req, res) => {
    const content: {
      friends: IFriends[];
      incoming: any[];
      outgoing: any[];
      suggested: any[];
      blocklist: any[];
      settings: { acceptInvites: string };
    } = {
      friends: [],
      incoming: [],
      outgoing: [],
      suggested: [],
      blocklist: [],
      settings: {
        acceptInvites: "public",
      },
    };
    const { accountId } = req.params;
    const user = await Friends.findOne({ accountId }).lean();

    if (!user) {
      return res.status(404).json({ error: "Failed to find User." });
    }

    const acceptedFriends = user.friends.accepted;
    const incomingFriends = user.friends.incoming;
    const outgoingFriends = user.friends.outgoing;

    for (const friend of acceptedFriends) {
      content.friends.push({
        accountId: friend.accountId,
        groups: [],
        mutual: 0,
        alias: "",
        note: "",
        createdAt: DateTime.fromISO(friend.createdAt)
          .toUTC()
          .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
        favorite: false,
      });
    }

    for (const friend of incomingFriends) {
      content.incoming.push({
        accountId: friend.accountId,
        groups: [],
        mutual: 0,
        alias: "",
        note: "",
        createdAt: DateTime.fromISO(friend.createdAt)
          .toUTC()
          .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
        favorite: false,
      });
    }

    for (const friend of outgoingFriends) {
      content.outgoing.push({
        accountId: friend.accountId,
        groups: [],
        mutual: 0,
        alias: "",
        note: "",
        createdAt: DateTime.fromISO(friend.createdAt)
          .toUTC()
          .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
        favorite: false,
      });

      content.blocklist.push({
        accountId: friend.accountId,
        groups: [],
        mutual: 0,
        alias: "",
        note: "",
        createdAt: DateTime.fromISO(friend.createdAt)
          .toUTC()
          .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
        favorite: false,
      });
    }

    res.json(content);
  });

  router.get("/friends/api/v1/:accountId/blocklist", async (req, res) => {
    res.json([]);
  });

  router.get("/friends/api/v1/:accountId/settings", async (req, res) => {
    res.json([]);
  });

  router.get("/friends/api/v1/:accountId/recent/fortnite", async (req, res) => {
    res.json([]);
  });

  router.post(
    "/friends/api/v1/:accountId/friends/:friendId",
    verifyToken,
    async (req, res) => {
      const { accountId, friendId } = req.params;

      const user = await Friends.findOne({ accountId });
      const friend = await Friends.findOne({ accountId: friendId });

      if (!user || !friend) {
        return res.status(404).json({ error: "User or Friend not found" });
      }

      const incomingFriends = user.friends.incoming.find(
        (incoming) => incoming.accountId === friend.accountId
      );

      const incomingFriendsIndex = user.friends.incoming.findIndex(
        (incoming) => incoming.accountId === friend.accountId
      );

      if (incomingFriends && incomingFriendsIndex !== -1) {
        user.friends.incoming.splice(incomingFriendsIndex, 1);
        user.friends.accepted.push({
          accountId: friend.accountId,
          createdAt: DateTime.now().toISO(),
        });

        sendXmppMessageToClient(
          {
            payload: {
              accountId: user.accountId,
              status: "ACCEPTED",
              direction: "INBOUND",
              favorite: false,
              created: DateTime.now().toISO(),
            },
            type: "com.epicgames.friends.core.apiobjects.Friend",
            timestamp: DateTime.now().toISO(),
          },
          friend.accountId
        );

        sendXmppMessageToClient(
          {
            payload: {
              accountId: user.accountId,
              status: "ACCEPTED",
              direction: "OUTBOUND",
              favorite: false,
              created: DateTime.now().toISO(),
            },
            type: "com.epicgames.friends.core.apiobjects.Friend",
            timestamp: DateTime.now().toISO(),
          },
          user.accountId
        );

        friend.friends.outgoing.splice(
          friend.friends.outgoing.findIndex(
            (index) => index.accountId === user.accountId
          ),
          1
        );
        friend.friends.accepted.push({
          accountId: user.accountId,
          createdAt: DateTime.now().toISO(),
        });

        const clientIndex = Globals.Clients.findIndex(
          (client) => client.accountId === friendId
        );
        const friendIndex = Globals.Clients.findIndex(
          (client) => client.accountId === accountId
        );

        if (clientIndex !== -1) {
          const client = Globals.Clients[clientIndex];
          const friendClient = Globals.Clients[friendIndex];

          console.log(JSON.stringify(client));
          console.log(JSON.stringify(friendClient));

          client.socket?.send(
            xmlbuilder
              .create("presence")
              .attribute("to", client.jid)
              .attribute("xmlns", "jabber:client")
              .attribute("from", friendClient.jid)
              .attribute("type", "available")
              .element("status", friendClient.lastPresenceUpdate?.status)
              .toString({ pretty: true })
          );

          friendClient.socket?.send(
            xmlbuilder
              .create("presence")
              .attribute("to", friendClient.jid)
              .attribute("xmlns", "jabber:client")
              .attribute("from", client.jid)
              .attribute("type", "available")
              .element("status", client.lastPresenceUpdate?.status)
              .toString({ pretty: true })
          );
        }

        await user.updateOne({ $set: { friends: user.friends } });
        await friend.updateOne({ $set: { friends: friend.friends } });
      } else {
        user.friends.outgoing.push({
          accountId: friend.accountId,
          createdAt: DateTime.now().toISO(),
        });

        sendXmppMessageToClient(
          {
            payload: {
              accountId: user.accountId,
              status: "PENDING",
              direction: "INBOUND",
              favorite: false,
              created: DateTime.now().toISO(),
            },
            type: "com.epicgames.friends.core.apiobjects.Friend",
            timestamp: DateTime.now().toISO(),
          },
          friend.accountId
        );

        sendXmppMessageToClient(
          {
            payload: {
              accountId: friend.accountId,
              status: "PENDING",
              direction: "OUTBOUND",
              favorite: false,
              created: DateTime.now().toISO(),
            },
            type: "com.epicgames.friends.core.apiobjects.Friend",
            timestamp: DateTime.now().toISO(),
          },
          user.accountId
        );

        friend.friends.incoming.push({
          accountId: user.accountId,
          createdAt: DateTime.now().toISO(),
        });

        await user.updateOne({ $set: { friends: user.friends } });
        await friend.updateOne({ $set: { friends: friend.friends } });
      }

      res.status(204).end();
    }
  );
}
