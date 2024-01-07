import { Router } from "express";
import { createDefaultResponse, getSeason, sendErrorResponse } from "../utils";
import Users from "../models/Users";
import Accounts from "../models/Accounts";
import ProfileAthena from "../common/mcp/operations/QueryProfile/Athena";
import ProfileCommonCore from "../common/mcp/operations/QueryProfile/CommonCore";
import SetCosmeticLockerSlot from "../common/mcp/operations/SetCosmeticLockerSlot/SetCosmeticLockerSlot";
import EquipBattleRoyaleCustomization from "../common/mcp/operations/EquipBattleRoyaleCustomization/EquipBattleRoyaleCustomization";
import ClaimMfaEnabled from "../common/mcp/operations/ClaimMfaEnabled/ClaimMfaEnabled";
import MarkItemSeen from "../common/mcp/operations/MarkItemSeen/MarkItemSeen";
import ClientQuestLogin from "../common/mcp/operations/ClientQuestLogin/ClientQuestLogin";
import PurchaseCatalogEntry from "../common/mcp/operations/PurchaseCatalogEntry/PurchaseCatalogEntry";
import verifyToken from "../middleware/verifyToken";
import log from "../utils/log";

export default function initRoute(router: Router): void {
  router.post(
    [
      "/fortnite/api/game/v2/profile/:accountId/*/EquipBattleRoyaleCustomization",
      "/fortnite/api/game/v2/profile/:accountId/*/SetCosmeticLockerSlot",
    ],
    verifyToken,
    async (req, res) => {
      try {
        const { accountId } = req.params;
        const {
          slotName,
          itemToSlot,
          indexWithinSlot,
          category,
          variantUpdates,
          rvn,
          slotIndex,
          lockerItem,
        } = req.body;

        if (slotName !== undefined) {
          return await EquipBattleRoyaleCustomization(
            accountId,
            slotName,
            itemToSlot,
            slotIndex,
            indexWithinSlot,
            variantUpdates,
            rvn as any,
            res
          );
        } else {
          return res.json(
            await SetCosmeticLockerSlot(
              accountId,
              category,
              itemToSlot,
              slotIndex,
              variantUpdates,
              lockerItem,
              rvn as any,
              res
            )
          );
        }
      } catch (error) {
        let err = error as Error;
        log.error(`Error updating profile: ${err.message}`, "MCP");
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  );

  router.post(
    "/fortnite/api/game/v2/profile/:accountId/*/:command",
    verifyToken,
    async (req, res) => {
      const { accountId, command } = req.params;
      const { rvn, profileId } = req.query;
      const userAgent = req.headers["user-agent"];
      let season = getSeason(userAgent);

      try {
        switch (command) {
          case "QueryProfile":
          case "SetHardcoreModifier":
            switch (profileId) {
              case "athena":
              case "profile0":
                const athenaProfile = await ProfileAthena(
                  Users,
                  Accounts,
                  accountId,
                  profileId,
                  false,
                  season?.season as number,
                  rvn,
                  res
                );
                return res.json(athenaProfile);

              case "common_core":
              case "common_public":
                const commonCoreProfile = await ProfileCommonCore(
                  Accounts,
                  accountId,
                  profileId
                );
                return res.json(commonCoreProfile);

              default:
                return res.json(
                  createDefaultResponse([], profileId, (rvn as any) + 1)
                );
            }
            break;

          case "ClaimMfaEnabled":
            res
              .status(204)
              .json(await ClaimMfaEnabled(res, profileId as string, accountId));
            break;

          case "MarkItemSeen":
            await MarkItemSeen(
              profileId as string,
              accountId,
              rvn as any,
              res,
              req
            );
            break;

          case "ClientQuestLogin":
            const result = await ClientQuestLogin(
              accountId,
              profileId as string,
              rvn as any,
              req
            );

            res.json(result).status(204);
            break;

          case "SetMtxPlatform":
            break;

          case "PurchaseCatalogEntry":
            await PurchaseCatalogEntry(
              accountId,
              profileId as string,
              rvn as any,
              req,
              res
            );
            break;

          default:
            log.error(`Unknown MCP Operation: ${command}`, "MCP");
        }
      } catch (error) {
        let err: Error = error as Error;
        log.error(`An error has occured: ${err.message}`, "MCP");

        res.json(createDefaultResponse([], profileId, (rvn as any) + 1 || 1));
      }
    }
  );
}
