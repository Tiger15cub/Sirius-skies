import { DateTime } from "luxon";
import { getProfile } from "../../utils/getProfile";
import Accounts from "../../../../models/Accounts";
import { Request, Response } from "express";
import path from "node:path";
import { v4 as uuid } from "uuid";
import fs from "node:fs/promises";
import log from "../../../../utils/log";

export default async function FortRerollDailyQuest(
  res: Response,
  req: Request,
  accountId: string,
  profileId: string
) {
  try {
    const userProfiles = await getProfile(accountId);
    const account = await Accounts.findOne({ accountId });
    const { questId } = req.body;

    const dailyQuestsPath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "resources",
      "quests",
      "DailyQuests.json"
    );
    const dailyQuestsData = await fs.readFile(dailyQuestsPath, "utf-8");
    const dailyQuests = JSON.parse(dailyQuestsData);

    if (!account) {
      return res.status(404).json({ error: "Failed to find Account." });
    }

    const applyProfileChanges: any[] = [];
    const notifications: any[] = [];

    if (
      userProfiles.stats.attributes.quest_manager.dailyQuestRerolls >= 1 &&
      questId
    ) {
      userProfiles.stats.attributes.quest_manager.dailyQuestRerolls -= 1;

      if (userProfiles.items.hasOwnProperty(questId)) {
        delete userProfiles.items[questId];

        const existingTemplateIds = new Set(
          Object.values(userProfiles.items)
            .filter((quest: any) => quest.templateId)
            .map((quest: any) => quest.templateId.toLowerCase())
        );

        const uniqueQuests = dailyQuests.filter(
          (quest: any) =>
            !existingTemplateIds.has(quest.templateId.toLowerCase())
        );

        if (uniqueQuests.length > 0) {
          const randomIndex = Math.floor(Math.random() * uniqueQuests.length);
          const randomQuest = uniqueQuests[randomIndex];

          const randomQuestId = uuid();

          userProfiles.items[randomQuestId] = {
            templateId: randomQuest.templateId,
            attributes: {
              quest_state: "Active",
              level: -1,
              item_seen: false,
              sent_new_notification: false,
              xp_reward_scalar: 1,
              challenge_bundle_id: "",
              challenge_linked_quest_given: "",
              challenge_linked_quest_parent: "",
              playlists: [],
              bucket: "",
              last_state_change_time: DateTime.now().toISO(),
              max_level_bonus: 0,
              xp: 500,
              quest_rarity: "uncommon",
              favorite: false,
              quest_pool: "",
              creation_time: DateTime.now().toISO(),
            },
            quantity: 1,
          };

          for (const objKey in randomQuest.objectives) {
            const objValue = randomQuest.objectives[objKey];
            const completionKey = `completion_${objValue.toLowerCase()}`;
            userProfiles.items[randomQuestId].attributes[completionKey] = 0;
          }

          applyProfileChanges.push({
            changeType: "itemAdded",
            itemId: randomQuestId,
            item: userProfiles.items[randomQuestId],
          });

          applyProfileChanges.push({
            changeType: "itemRemoved",
            itemId: questId,
          });

          notifications.push({
            type: "dailyQuestReroll",
            primary: true,
            newQuestId: randomQuest.templateId,
          });
        }
      }
    }

    if (applyProfileChanges.length > 0) {
      userProfiles.rvn += 1;
      userProfiles.commandRevision += 1;
      userProfiles.Update = DateTime.now().toISO();
    }

    res.json({
      profileRevision: userProfiles.rvn || 0,
      profileId: "athena",
      profileChangesBaseRevision: account.baseRevision || 0,
      profileChanges: applyProfileChanges,
      notifications: notifications,
      profileCommandRevision: userProfiles.commandRevision || 0,
      serverTime: DateTime.now().toISO(),
      responseVersion: 1,
    });

    if (applyProfileChanges.length > 0) {
      await account.updateOne({ $set: { athena: userProfiles } }).cacheQuery();
    }
  } catch (error) {
    log.error(`An error occurred: ${error}`, "FortRerollDailyQuest");
    res.status(500).json({ error: "Internal server error." });
  }
}
