import { Router } from "express";
import { createDefaultResponse, getSeason, sendErrorResponse } from "../utils";
import Users from "../models/Users";
import Accounts from "../models/Accounts";
import ProfileAthena from "../common/mcp/operations/QueryProfile/Athena";
import ProfileCommonCore from "../common/mcp/operations/QueryProfile/CommonCore";
import { CommonCoreData } from "../interface";
import SetCosmeticLockerSlot from "../common/mcp/operations/SetCosmeticLockerSlot/SetCosmeticLockerSlot";
import EquipBattleRoyaleCustomization from "../common/mcp/operations/EquipBattleRoyaleCustomization/EquipBattleRoyaleCustomization";
import log from "../utils/log";
import ClaimMfaEnabled from "../common/mcp/operations/ClaimMfaEnabled/ClaimMfaEnabled";
import MarkItemSeen from "../common/mcp/operations/MarkItemSeen/MarkItemSeen";
import ClientQuestLogin from "../common/mcp/operations/ClientQuestLogin/ClientQuestLogin";

export default function initRoute(router: Router): void {
  router.post(
    "/fortnite/api/game/v2/profile/:accountId/*/:command",
    async (req, res) => {
      const { accountId, command } = req.params;
      const { rvn, profileId } = req.query;
      const {
        slotName,
        itemToSlot,
        indexWithinSlot,
        category,
        variantUpdates,
        slotIndex,
      } = req.body;

      const userAgent = req.headers["user-agent"];
      let season = getSeason(userAgent);

      try {
        switch (command) {
          case "QueryProfile":
          case "SetHardcoreModifier":
            if (profileId === "athena" || profileId === "profile0") {
              return res
                .status(204)
                .json(
                  await ProfileAthena(
                    Users,
                    Accounts,
                    accountId,
                    profileId,
                    false,
                    season?.season as number,
                    rvn
                  )
                );
            } else if (
              profileId === "common_core" ||
              profileId === "common_public"
            ) {
              return res
                .status(204)
                .json(await ProfileCommonCore(Accounts, accountId, profileId));
            }
            res.status(200).end();
            break;

          case "SetCosmeticLockerSlot":
            res
              .status(204)
              .json(
                await SetCosmeticLockerSlot(
                  category,
                  itemToSlot,
                  accountId,
                  slotIndex,
                  variantUpdates
                )
              );
            break;

          case "EquipBattleRoyaleCustomization":
            res
              .status(204)
              .json(
                await SetCosmeticLockerSlot(
                  category,
                  itemToSlot,
                  accountId,
                  slotIndex,
                  variantUpdates
                )
              );
            break;

          case "ClaimMfaEnabled":
            res
              .status(204)
              .json(await ClaimMfaEnabled(res, profileId as string, accountId));
            break;

          case "MarkItemSeen":
            res
              .status(204)
              .json(await MarkItemSeen(profileId as string, rvn as any, req));
            break;

          case "ClientQuestLogin":
            res
              .status(204)
              .json(
                await ClientQuestLogin(profileId as string, rvn as any, req)
              );
            break;
        }
      } catch (error) {
        let err: Error = error as Error;
        log.error(`An error has occured: ${err.message}`, "MCP");

        res.json(createDefaultResponse([], profileId, (rvn as any) + 1 || 1));
      }
    }
  );
}
