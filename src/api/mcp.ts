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
import PurchaseCatalogEntry from "../common/mcp/operations/PurchaseCatalogEntry/PurchaseCatalogEntry";
import verifyToken from "../middleware/verifyToken";
import log from "../utils/log";
import { getProfile } from "../common/mcp/utils/getProfile";
import MetaData from "../common/mcp/operations/QueryProfile/MetaData";
import OutPost from "../common/mcp/operations/QueryProfile/Outpost0";
import Theater from "../common/mcp/operations/QueryProfile/Theater0";

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

      const userProfiles: any = await getProfile(accountId);

      try {
        console.log(profileId);
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

              case "creative":
                res.json(
                  createDefaultResponse([], profileId, userProfiles.rvn)
                );
                break;
              case "collection_book_schematics0":
                res.json(
                  createDefaultResponse([], profileId, userProfiles.rvn)
                );
                break;
              case "collection_book_people0":
                res.json(
                  createDefaultResponse([], profileId, userProfiles.rvn)
                );
                break;

              case "theater0":
                const theater0Profile = await Theater(accountId, res);
                res.json(theater0Profile);
                break;

              case "outpost0":
                const outpost0Profile = await OutPost(accountId, res);
                res.json(outpost0Profile);
                break;

              case "metadata":
                const metaDataProfile = await MetaData(accountId, res);
                res.json(metaDataProfile);
                break;

              case "QuestLogin":
                res.json(
                  createDefaultResponse([], profileId, userProfiles.rvn)
                );
                break;

              default:
                console.log(profileId);
                res.status(400).json({
                  errorCode:
                    "errors.com.epicgames.modules.profiles.operation_forbidden",
                  errorMessage: `Unable to find template configuration for profile ${profileId}`,
                  messageVars: undefined,
                  numericErrorCode: 12813,
                  originatingService: "fortnite",
                  intent: "prod-live",
                  error_description: `Unable to find template configuration for profile ${profileId}`,
                  error: "invalid_client",
                });
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
            // TODO: Rewrite
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
