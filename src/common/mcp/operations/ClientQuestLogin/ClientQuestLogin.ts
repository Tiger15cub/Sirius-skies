import { DateTime } from "luxon";
import Accounts from "../../../../models/Accounts";
import { createDefaultResponse, getSeason } from "../../../../utils";
import axios from "axios";
import { v4 as uuid } from "uuid";
import log from "../../../../utils/log";
import AddDailyQuest, { QuestUtil } from "../../utils/AddDailyQuest";

export default async function ClientQuestLogin(
  accountId: string,
  profileId: string,
  rvn: number,
  req: any
) {
  const userAgent = req.headers["user-agent"];
  let season = getSeason(userAgent);

  const multiUpdate: any[] = [];
  let shouldGrantQuest: boolean = false;

  const request = await axios.get("https://fnquests.onrender.com/api/daily");

  const { data } = request;
  const QuestData = data;

  let amountOfQuests: number = 0;
  let isMoreQuests: number = 0;

  const account = await Accounts.findOne({ accountId }).lean();

  if (!account)
    return {
      errorMessage: "Account not found.",
    };

  const randomUUID = uuid();

  if (!season) return { errorMessage: "Season is undefined or not found." };

  for (const data of account.Season) {
    let { bookXP, level, bookLevel, battleStars, quest_manager } = data;

    if (data.seasonNumber === season.season) {
      for (const questItemKey of data.quests) {
        for (const quests of Object.entries(questItemKey)) {
          const Quest: any = quests[1];

          if (Quest.templateId.startsWith("Quest:AthenaDaily")) {
            if (Quest.attributes.quest_state === "Claimed") {
              for (const dailyQuest of QuestData) {
                if (dailyQuest.templateId === Quest.templateId) {
                  bookXP += +parseInt(
                    dailyQuest.attributes.xp.toString() || "0"
                  );
                  battleStars += 5;
                }
              }
            } else {
              amountOfQuests += 1;
            }
          }
        }
      }

      if (quest_manager && quest_manager.dailyLoginInterval) {
        const loginDate = DateTime.fromISO(
          quest_manager.dailyLoginInterval
        ).toISODate();
        const currentDate = DateTime.local().toISODate();

        console.log(loginDate);
        console.log(currentDate);

        if (loginDate !== currentDate) {
          shouldGrantQuest = true;

          if (quest_manager.dailyQuestRerolls <= 0) {
            quest_manager.dailyQuestRerolls += 1;
          }
        } else {
          shouldGrantQuest = false;
        }
      }

      if (amountOfQuests < 3 && shouldGrantQuest) {
        await AddDailyQuest(profileId, accountId, req, rvn, randomUUID);

        multiUpdate.push({
          changeType: "itemAdded",
          itemId: randomUUID,
          item: QuestUtil.items[randomUUID],
        });

        quest_manager.dailyLoginInterval = DateTime.utc().toISO();

        multiUpdate.push({
          changeType: "statModified",
          name: "quest_manager",
          value: {
            dailyLoginInterval: quest_manager.dailyLoginInterval,
            dailyQuestRerolls: parseInt(
              quest_manager.dailyQuestRerolls.toString() || "0"
            ),
          },
        });

        log.debug(JSON.stringify(multiUpdate), "ClientQuestLogin");
      }

      return {
        profileRevision: account.profilerevision,
        profileId,
        profileChangesBaseRevision: account.baseRevision,
        profileChanges: multiUpdate,
        profileCommandRevision: rvn,
        serverTime: DateTime.now().toISO(),
        responseVersion: 1,
      };
    }
    isMoreQuests += 1;
  }
  return createDefaultResponse([], profileId, rvn);
}
