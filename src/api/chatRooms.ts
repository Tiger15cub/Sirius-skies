import { Router } from "express";
import { Saves } from "../xmpp/types/Saves";

export default function initRoute(router: Router) {
  router.post(
    [
      "/fortnite/api/game/v2/chat/:accountId/reserveGeneralChatRooms/Athena/:platform",
      "/fortnite/api/game/v2/chat/:accountId/recommendGeneralChatRooms/Athena/:platform",
    ],
    (req, res) => {
      res.json({
        globalChatRooms: [
          {
            roomName: "fortnite",
            currentMemberCount: Saves.ConnectedClients.size,
            maxMembersCount: 7777,
            publicFacingShardName: "Sirius Global Chat Room",
          },
        ],
        founderChatRooms: [],
        bNeedsPaidAccessForGlobalChat: false,
        bNeedsPaidAccessForFounderChat: false,
        bIsGlobalChatDisabled: false,
        bIsFounderChatDisabled: true,
        bIsSubGameGlobalChatDisabled: false,
      });
    }
  );
}
