import { Router } from "express";
import { Friend, IFriends } from "../interface";
import { DateTime } from "luxon";
import Friends from "../models/Friends";
import { Globals } from "../xmpp/types/XmppTypes";
import xmlbuilder from "xmlbuilder";
import sendXmppMessageToClient from "../utils/sendXmppMessageToClient";
import verifyToken from "../middleware/verifyToken";
import getPresence from "../xmpp/functions/updateUserPresence";
import updateUserPresence from "../xmpp/functions/updateUserPresence";
import AccountRefresh from "../utils/AccountRefresh";
import Users from "../models/Users";

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
    res.json({
      acceptInvites: "public",
    });
  });

  router.get("/friends/api/v1/:accountId/recent/:type", async (req, res) => {
    res.json([]);
  });

  router.get(
    "/friends/api/v1/:accountId/friends/:friendId",
    verifyToken,
    async (req, res) => {
      const { friendId, accountId } = req.params;

      const user = await Friends.findOne({ accountId });
      const friend = await Friends.findOne({ accountId: friendId });

      if (!user || !friend) {
        return res.status(404).json({ error: "User or Friend not found" });
      }

      const acceptedFriends = user.friends.accepted.find(
        (accepted) => accepted.accountId === friend.accountId
      );

      if (acceptedFriends !== undefined) {
        res.json({
          accountId: user.accountId,
          groups: [],
          mutual: 0,
          alias: "",
          note: "",
          favorite: false,
          created: acceptedFriends.createdAt,
        });
      } else {
        res.status(404).json({
          errorCode: "errors.com.epicgames.friends.friendship_not_found",
          errorMessage: `Friendship between ${user.accountId} and ${friend.accountId} does not exist.`,
          messageVars: undefined,
          numericErrorCode: 14004,
          originatingService: "any",
          intent: "prod",
          error_description: `Friendship between ${user.accountId} and ${friend.accountId} does not exist.`,
          error: "friends",
        });
      }
    }
  );

  router.get(
    "/friends/api/v1/:accountId/incoming",
    verifyToken,
    async (req, res) => {
      const { accountId } = req.params;

      const user = await Friends.findOne({ accountId }).lean();

      if (!user) {
        return res.status(404).json({ error: "Failed to find user." });
      }

      const incomingFriends = user.friends.incoming.map((friend) => {
        return {
          accountId: friend.accountId,
          groups: [],
          alias: "",
          note: "",
          favorite: false,
          created: friend.createdAt,
        };
      });

      res.json(incomingFriends);
    }
  );

  router.get(
    "/friends/api/v1/:accountId/outgoing",
    verifyToken,
    async (req, res) => {
      const { accountId } = req.params;

      const user = await Friends.findOne({ accountId }).lean();

      if (!user) {
        return res.status(404).json({ error: "Failed to find user." });
      }

      const outgoingFriends = user.friends.outgoing.map((friend) => {
        return {
          accountId: friend.accountId,
          groups: [],
          alias: "",
          note: "",
          favorite: false,
          created: friend.createdAt,
        };
      });

      res.json(outgoingFriends);
    }
  );

  router.get(
    "/friends/api/public/list/fortnite/:accountId/recentPlayers",
    (req, res) => {
      res.json([]);
    }
  );

  router.get("/friends/api/public/blocklist/:accountId", (req, res) => {
    res.json([]);
  });

  router.post(
    [
      "/friends/api/v1/:accountId/friends/:friendId",
      "/friends/api/public/friends/:accountId/:friendId",
    ],
    verifyToken,
    async (req, res) => {
      const { accountId, friendId } = req.params;

      const user = await Friends.findOne({ accountId });
      const friend = await Friends.findOne({ accountId: friendId });

      const userAccount = await Users.findOne({ accountId });
      const friendAccount = await Users.findOne({ accountId: friendId });

      if (!user || !friend || !userAccount || !friendAccount) {
        return res.status(404).json({ error: "User or Friend not found" });
      }

      const incomingFriends = user.friends.incoming.find(
        (incoming) => incoming.accountId === friend.accountId
      );

      const acceptedFriends = user.friends.accepted.find(
        (accepted) => accepted.accountId === friend.accountId
      );

      const outgoingFriends = user.friends.outgoing.find(
        (outgoing) => outgoing.accountId === friend.accountId
      );

      const incomingFriendsIndex = user.friends.incoming.findIndex(
        (incoming) => incoming.accountId === friend.accountId
      );

      if (acceptedFriends !== undefined) {
        res.status(409).json({
          errorCode: "errors.com.epicgames.friends.friend_request_already_sent",
          errorMessage: `Friendship between ${user.accountId} and ${friend.accountId} already exists.`,
          messageVars: undefined,
          numericErrorCode: 14014,
          originatingService: "any",
          intent: "prod",
          error_description: `Friendship between ${user.accountId} and ${friend.accountId} already exists.`,
          error: "friends",
        });
      }

      if (outgoingFriends !== undefined) {
        res.status(409).json({
          errorCode: "errors.com.epicgames.friends.friend_request_already_sent",
          errorMessage: `Friendship request has already been sent to ${friend.accountId}`,
          messageVars: undefined,
          numericErrorCode: 14014,
          originatingService: "any",
          intent: "prod",
          error_description: `Friendship request has already been sent to ${friend.accountId}`,
          error: "friends",
        });
      }

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

        updateUserPresence(user.accountId, friend.accountId, false);
        updateUserPresence(friend.accountId, user.accountId, false);

        await user.updateOne({ $set: { friends: user.friends } });
        await friend.updateOne({ $set: { friends: friend.friends } });

        // await AccountRefresh(user.accountId, userAccount.username);
        // await AccountRefresh(friend.accountId, friendAccount.username);
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

        await AccountRefresh(user.accountId, userAccount.username);
        await AccountRefresh(friend.accountId, friendAccount.username);
      }

      res.status(204).end();
    }
  );
}
