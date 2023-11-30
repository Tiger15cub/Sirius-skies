import { Router } from "express";
import { createDefaultResponse, getSeason, sendErrorResponse } from "../utils";
import Users from "../models/Users";
import Accounts from "../models/Accounts";
import ProfileAthena from "../common/mcp/ProfileAthena";
import ProfileCommonCore from "../common/mcp/ProfileCommonCore";
import { CommonCoreData, CommonCoreProfile } from "../interface";
import EquipBattleRoyaleCustomization from "../common/mcp/EquipBattleRoyaleCustomization";
import SetCosmeticLockerSlot from "../common/mcp/SetCosmeticLockerSlot";

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
            season,
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
      "/fortnite/api/game/v2/profile/:accountId/client/EquipBattleRoyaleCustomization",
      "/fortnite/api/game/v2/profile/:accountId/client/SetCosmeticLockerSlot",
    ],
    async (req, res) => {
      const { accountId } = req.params;
      const {
        rvn,
        profileId,
        slotName,
        itemToSlot,
        indexWithinSlot,
        variantUpdates,
        slotIndex,
        category,
      } = req.body;

      if (slotName !== undefined) {
        return res.json(
          await EquipBattleRoyaleCustomization(
            Accounts,
            accountId,
            profileId as string,
            slotName as string,
            itemToSlot as string,
            indexWithinSlot as string,
            variantUpdates as string,
            rvn as any
          )
        );
      } else {
        return res.json(
          await SetCosmeticLockerSlot(
            Accounts,
            Users,
            accountId,
            category as string,
            itemToSlot as string,
            slotIndex as any,
            rvn as any
          )
        );
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
