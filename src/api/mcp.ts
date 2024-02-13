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
import { getCommonCore, getProfile } from "../common/mcp/utils/getProfile";
import MetaData from "../common/mcp/operations/QueryProfile/MetaData";
import OutPost from "../common/mcp/operations/QueryProfile/Outpost0";
import Theater from "../common/mcp/operations/QueryProfile/Theater0";
import fs from "node:fs/promises";
import path from "node:path";
import Friends from "../models/Friends";
import { DateTime } from "luxon";
import { GiftGlobals } from "../types/GiftTypes";
import xmlbuilder from "xmlbuilder";
import ClientQuestLogin from "../common/mcp/operations/ClientQuestLogin/ClientQuestLogin";
import MarkNewQuestNotificationSent from "../common/mcp/operations/MarkNewQuestNotificationSent/MarkNewQuestNotificationSent";
import { Globals, accountId } from "../xmpp/types/XmppTypes";
import RemoveGiftBox from "../common/mcp/operations/RemoveGiftBox/RemoveGiftBox";
import FortRerollDailyQuest from "../common/mcp/operations/FortRerollDailyQuest/FortRerollDailyQuest";
import CollectionBook from "../common/mcp/operations/QueryProfile/CollectionBook";
import GiftCatalogEntry from "../common/mcp/operations/GiftCatalogEntry/GiftCatalogEntry";
import SetPartyAssistQuest from "../common/mcp/operations/SetPartyAssistQuest/SetPartyAssistQuest";
import RefundMtxPurchase from "../common/mcp/operations/RefundMtxPurchase/RefundMtxPurchase";
import SetAffiliateName from "../common/mcp/operations/SetAffiliateName/SetAffiliateName";
import { profile } from "winston";
import sendXmppMessageToClient from "../utils/sendXmppMessageToClient";
import Cache from "../middleware/Cache";

export default function initRoute(router: Router): void {
  router.post(
    "/fortnite/api/game/v2/profile/:accountId/client/EquipBattleRoyaleCustomization",
    verifyToken,
    async (req, res) => {
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

      const userProfiles: any = await getProfile(accountId);

      return await EquipBattleRoyaleCustomization(
        accountId,
        slotName,
        itemToSlot,
        slotIndex,
        indexWithinSlot,
        variantUpdates,
        lockerItem,
        req.query.profileId as string,
        userProfiles.rvn,
        res
      );
    }
  );

  router.post(
    "/fortnite/api/game/v2/profile/:accountId/client/SetCosmeticLockerSlot",
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

        const userProfiles: any = await getProfile(accountId);

        return await SetCosmeticLockerSlot(
          accountId,
          category,
          itemToSlot,
          slotIndex,
          variantUpdates,
          lockerItem,
          userProfiles.rvn,
          res
        );
      } catch (error) {
        let err = error as Error;
        log.error(`Error updating profile: ${err.message}`, "MCP");
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  );

  router.post(
    "/fortnite/api/game/v3/profile/:accountId/client/emptygift",
    async (req, res) => {
      try {
        const {
          playerName,
          personalMessage,
          giftWrapTemplateId,
          receiverPlayerName,
        } = req.body;
        const user = await Users.findOne({ username: playerName });

        const applyProfileChanges: any[] = [];

        if (!user) {
          return sendErrorResponse(
            res,
            "errors.com.epicgames.user.not_found",
            "Sender not found."
          );
        }

        const sender = user.accountId;
        const commonCore = await getCommonCore(sender);
        const giftBoxFilePath = path.join(
          __dirname,
          "..",
          "common",
          "resources",
          "mcp",
          "GiftBoxes.json"
        );
        const GiftBoxes = JSON.parse(
          await fs.readFile(giftBoxFilePath, "utf8")
        );

        const receiver = await Accounts.findOne({ accountId: sender });

        if (!receiver)
          return res.status(404).json({ error: "Failed to find Account." });

        if (personalMessage.length > 100) {
          return sendErrorResponse(
            res,
            "errors.com.epicgames.string.length_check",
            "Personal message is longer than 100 characters."
          );
        }

        if (!GiftBoxes.includes(giftWrapTemplateId)) {
          return sendErrorResponse(
            res,
            "errors.com.epicgames.giftbox.invalid",
            "Invalid GiftBox. Please provide a valid GiftBox."
          );
        }

        const athena = await getProfile(sender);

        athena.rvn += 1;
        athena.commandRevision += 1;
        athena.Updated = DateTime.now().toISO();

        commonCore.rvn += 1;
        commonCore.commandRevision += 1;
        commonCore.Updated = DateTime.now().toISO();

        await receiver
          .updateOne({ $set: { athena, common_core: commonCore } })
          .cacheQuery();

        GiftGlobals.GiftsReceived[sender] = true;

        sendXmppMessageToClient(
          {
            type: "com.epicgames.gift.received",
            payload: {},
            timestamp: DateTime.now().toISO(),
          },
          sender
        );

        if (applyProfileChanges.length > 0 && sender !== accountId) {
          commonCore.rvn += 1;
          commonCore.commandRevision += 1;
          commonCore.Updated = DateTime.now().toISO();

          await receiver
            .updateOne({ $set: { common_core: commonCore } })
            .cacheQuery();
        }

        res.json({
          profileRevision: commonCore.rvn || 0,
          profileId: "common_core",
          profileChangesBaseRevision: commonCore.rvn || 0,
          profileChanges: applyProfileChanges,
          notifications: [],
          profileCommandRevision: commonCore.commandRevision || 0,
          serverTime: DateTime.now().toISO(),
          responseVersion: 1,
        });
      } catch (error) {
        console.log(error);
        return sendErrorResponse(
          res,
          "errors.com.epicgames.generic_error",
          "An error occurred processing the request."
        );
      }
    }
  );

  router.post(
    "/fortnite/api/game/v2/profile/:accountId/client/:command",
    Cache,
    verifyToken,
    async (req, res) => {
      const { accountId, command } = req.params;
      const { rvn, profileId } = req.query;
      const userAgent = req.headers["user-agent"];
      let season = getSeason(userAgent);

      const userProfiles: any = await getProfile(accountId);

      const user = await Users.findOne({ accountId }).cacheQuery();

      if (!user) return res.status(404).json({ error: "Failed to find User." });

      try {
        switch (command) {
          case "QueryProfile":
          case "SetHardcoreModifier":
            switch (profileId) {
              case "athena":
              case "profile0":
                return await ProfileAthena(
                  Users,
                  Accounts,
                  accountId,
                  false,
                  season?.season as number,
                  res
                );

              case "common_core":
              case "common_public":
                return await ProfileCommonCore(
                  Accounts,
                  accountId,
                  profileId,
                  res,
                  req
                );

              case "creative":
                res.json(
                  createDefaultResponse([], profileId, userProfiles.rvn)
                );
                break;
              case "collection_book_schematics0":
                await CollectionBook(
                  "collection_book_schematics0",
                  accountId,
                  res
                );
                break;
              case "collection_book_people0":
                await CollectionBook("collection_book_people0", accountId, res);
                break;

              case "theater0":
                await Theater(accountId, res);
                break;

              case "outpost0":
                await OutPost(accountId, res);
                break;

              case "metadata":
                await MetaData(accountId, res);
                break;

              case "collections":
                res.json(createDefaultResponse([], profileId, rvn as any));
                break;

              default:
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

          case "MarkItemSeen":
            await MarkItemSeen(
              profileId as string,
              accountId,
              rvn as any,
              res,
              req
            );
            break;

          case "ClaimMfaEnabled":
            res
              .status(204)
              .json(await ClaimMfaEnabled(res, profileId as string, accountId));
            break;

          case "SetMtxPlatform":
            res.json(createDefaultResponse([], profileId, userProfiles.rvn));
            break;

          case "ClientQuestLogin":
            await ClientQuestLogin(res, req, accountId, profileId as string);
            break;

          case "MarkNewQuestNotificationSent":
            await MarkNewQuestNotificationSent(
              res,
              req,
              accountId,
              profileId as string
            );
            break;

          case "FortRerollDailyQuest":
            await FortRerollDailyQuest(
              res,
              req,
              accountId,
              profileId as string
            );

            break;

          case "SetBansViewed":
            res.json(createDefaultResponse([], profileId, userProfiles.rvn));
            break;

          case "SetMatchmakingBansViewed":
            res.json(createDefaultResponse([], profileId, userProfiles.rvn));
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

          case "QuestLogin":
            res.json(createDefaultResponse([], profileId, userProfiles.rvn));
            break;

          case "RemoveGiftBox":
            await RemoveGiftBox(req, res, accountId, profileId as string);
            break;

          case "IncrementNamedCounterStat":
            res.json(createDefaultResponse([], profileId, userProfiles.rvn));
            break;

          case "GetMcpTimeForLogin":
            res.json(createDefaultResponse([], profileId, userProfiles.rvn));
            break;

          case "GiftCatalogEntry":
            await GiftCatalogEntry(req, res, accountId);
            break;

          case "SetPartyAssistQuest":
            await SetPartyAssistQuest(req, res, accountId);
            break;

          case "RefundMtxPurchase":
            await RefundMtxPurchase(req, res, accountId, profileId as string);
            break;

          case "SetAffiliateName":
            await SetAffiliateName(req, res, accountId, user.username);
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

  router.post(
    "/fortnite/api/game/v2/profile/:accountId/dedicated_server/:command",
    verifyToken,
    async (req, res) => {
      const { accountId } = req.params;
      const { profileId } = req.query;
      const userProfiles = await getProfile(accountId);
      const account = await Accounts.findOne({ accountId });

      if (!account)
        return res.status(404).json({ error: "Failed to find Account." });

      res.json({
        profileRevision: userProfiles.rvn || 0,
        profileId,
        profileChangesBaseRevision: account.baseRevision,
        profileChanges: [],
        profileCommandRevision: userProfiles.commandRevision || 0,
        serverTime: DateTime.now().toISO(),
        responseVersion: 1,
      });
    }
  );
}
