import { Router } from "express";
import { Friend, Friends, NewFriend } from "../interface";
import Users from "../models/Users";
import { DateTime } from "luxon";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getEnv } from "../utils";
import Accounts from "../models/Accounts";

export default function initRoute(router: Router) {
  router.get("/friends/api/public/friends/:accountId", async (req, res) => {
    const { accountId } = req.params;
    const user = await Users.findOne({ accountId }).lean();

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
      friends: Friends[];
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
    const user = await Users.findOne({ accountId }).lean();

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

  router.post(
    "/friends/api/v1/:accountId/friends/:friendId",
    async (req, res) => {
      const { accountId, friendId } = req.params;

      const token = req.headers["authorization"]
        ?.toString()
        .split("bearer ")[1];

      if (!token) {
        return res
          .status(404)
          .json({ error: "Authorization token not found." });
      }

      const accessToken = token.replace("eg1~", "");
      const decodedToken = jwt.verify(
        accessToken,
        getEnv("CLIENT_SECRET")
      ) as JwtPayload;

      const clientId = decodedToken.clid;
      const displayName = decodedToken.dn;

      const user = await Users.findOne({ accountId });
      const friend = await Users.findOne({ accountId: friendId });

      if (!user || !friend) {
        return res.status(404).json({ error: "User or Friend not found" });
      }

      const isFriendIncoming = user.friends.incoming.some(
        (f) => f.accountId === friend.accountId
      );

      if (isFriendIncoming) {
        const incomingFriendsForUser = friend.friends.incoming;
        const outgoingFriendsForUser = user.friends.outgoing;

        const isFriendIncoming = !incomingFriendsForUser.some((entry) => {
          return entry !== null && entry.accountId === friendId;
        });

        const isAccountIdInOutgoing = !outgoingFriendsForUser.some((entry) => {
          return entry !== null && entry.accountId === accountId;
        });

        if (!isFriendIncoming || !isAccountIdInOutgoing) {
          return res.status(404).json({ error: "Not Found." });
        }

        const friendToRemove = incomingFriendsForUser.filter((entry) => {
          return entry !== null && entry.accountId === friendId;
        });

        if (friendToRemove.length > 0) {
          return friendToRemove.forEach((f) => {
            const friendIndex = incomingFriendsForUser.indexOf(f);
            if (friendIndex !== undefined && friendIndex !== -1) {
              incomingFriendsForUser.splice(friendIndex, 1);
            }
          });
        }

        await Users.updateOne(
          { accountId },
          {
            $set: {
              "friends.incoming": incomingFriendsForUser,
            },
          }
        );

        const NewFriend: NewFriend = {
          accountId: friendId,
          createdAt: DateTime.utc().toFormat("yyyy-MM-ddTHH:mm:ss.SSS'Z'"),
        };

        await Users.updateOne(
          { accountId },
          {
            $push: {
              "friends.accepted": NewFriend,
            },
          }
        );

        // TODO
      }
    }
  );
}
