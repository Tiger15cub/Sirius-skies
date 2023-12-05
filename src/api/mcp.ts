import { Router } from "express";
import { createDefaultResponse, getSeason, sendErrorResponse } from "../utils";
import Users from "../models/Users";
import Accounts from "../models/Accounts";
import ProfileAthena from "../common/mcp/ProfileAthena";
import ProfileCommonCore from "../common/mcp/ProfileCommonCore";
import { CommonCoreData, CommonCoreProfile } from "../interface";
import {
  EquipBattleRoyaleCustomization,
  SetCosmeticLockerSlot,
} from "../common/mcp/Equip";
import log from "../utils/log";

export default function initRoute(router: Router): void {
  router.post(
    [
      "/fortnite/api/game/v2/profile/:accountId/client/QueryProfile",
      "/fortnite/api/game/v2/profile/:accountId/client/SetHardcoreModifier",
    ],
    async (req, res) => {
      const { accountId } = req.params;
      const { rvn, profileId } = req.query;

      const userAgent = req.headers["user-agent"];
      let season = getSeason(userAgent);

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
            rvn
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
    }
  );

  router.post(
    [
      "/fortnite/api/game/v2/profile/:accountId/*/EquipBattleRoyaleCustomization",
      "/fortnite/api/game/v2/profile/:accountId/*/SetCosmeticLockerSlot",
    ],
    async (req, res) => {
      try {
        const { accountId } = req.params;
        const {
          profileId,
          slotName,
          itemToSlot,
          indexWithinSlot,
          category,
          variantUpdates,
          rvn,
          slotIndex,
        } = req.body;

        if (req.body.slotName !== undefined) {
          return res.json(
            await EquipBattleRoyaleCustomization(
              accountId,
              profileId,
              slotName,
              itemToSlot,
              indexWithinSlot,
              variantUpdates,
              rvn
            )
          );
        } else {
          return res.json(
            await SetCosmeticLockerSlot(
              accountId,
              profileId,
              category,
              itemToSlot,
              slotIndex,
              variantUpdates,
              rvn as any
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
    "/fortnite/api/game/v2/profile/:accountId/client/ClaimMfaEnabled",
    async (req, res) => {
      const { accountId } = req.params;
      const { profileId } = req.query;

      const CommonCore = await ProfileCommonCore(
        Accounts,
        accountId,
        profileId as string
      ).then((data) => {
        const commonCoreData = data as CommonCoreData;
        return commonCoreData.profileChanges.find(
          (profileChangesData) => profileChangesData.profile.stats.attributes
        );
      });

      if (!CommonCore) {
        return res
          .status(404)
          .json({ error: "CommonCore Profile does not exist." });
      }

      if (CommonCore.profile.stats.attributes.mfa_enabled) {
        return sendErrorResponse(
          res,
          "OperationForbidden",
          "MFA is already enabled on your account."
        );
      }
    }
  );

  router.post(
    "/fortnite/api/game/v2/profile/:accountId/client/MarkItemSeen",
    async (req, res) => {
      const { accountId } = req.params;
      const { rvn, profileId } = req.query;

      const userAgent = req.headers["user-agent"];
      let season = getSeason(userAgent);

      return res
        .status(201)
        .json(createDefaultResponse([], profileId, (rvn as any) + 1));
    }
  );

  router.post(
    "/fortnite/api/game/v2/profile/:accountId/client/ClientQuestLogin",
    async (req, res) => {
      const { accountId } = req.params;
      const { rvn, profileId } = req.query;

      const userAgent = req.headers["user-agent"];
      let season = getSeason(userAgent);

      return res
        .status(201)
        .json(createDefaultResponse([], profileId, (rvn as any) + 1));
    }
  );
}
