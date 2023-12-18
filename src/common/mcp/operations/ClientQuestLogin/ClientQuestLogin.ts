import { DateTime } from "luxon";
import Accounts from "../../../../models/Accounts";
import { createDefaultResponse, getSeason } from "../../../../utils";
import axios from "axios";
import { v4 as uuid } from "uuid";

interface QuestItem {
  [key: string]: {
    templateId: string;
    attributes: {
      quest_rarity: string;
      xp: number;
      count: number;
      objectives: any[];
    };
  };
}

export default async function ClientQuestLogin(
  accountId: string,
  profileId: string,
  rvn: number,
  req: any
) {
  const userAgent = req.headers["user-agent"];
  let season = getSeason(userAgent);

  const request = await axios.get("https://fnquests.onrender.com/api/daily");

  const { data } = request;
  const QuestData = data;

  const account = await Accounts.findOne({ accountId }).lean();

  if (!account)
    return {
      errorMessage: "Failed to find Account.",
    };

  if (!season) return { errorMessage: "Season is undefined or not found." };

  let randomNum: number = Math.floor(Math.random() * data.length);
  let incrementNumber: number = 0;

  for (const data of account.Season) {
    if (data.seasonNumber === season) {
      for (const questItemKey in data.quests as QuestItem[]) {
        const questItem = (data.quests as QuestItem[])[questItemKey];

        while (
          QuestData[randomNum].templateId.toLowerCase() === questItem.templateId
        ) {
          randomNum = Math.floor(Math.random() * QuestData.length);
        }
      }

      const randomUUID = uuid();

      const items: Record<string, object> = {
        [randomUUID]: {
          templateId: QuestData[Math.random()].toString(),
          attributes: {
            creation_time: DateTime.now().toISO(),
            level: -1,
            playlists: [],
            sent_new_notification: false,
            challenge_bundle_id: "",
            xp_reward_scaler: 1,
            challenge_linked_quest_given: "",
            quest_pool: "",
            quest_state: "Active",
            bucket: "",
            last_state_change_time: DateTime.utc().toFormat(
              "yyyy-MM-ddTHH:mm:ss.SSS'Z'"
            ),
            challenge_linked_quest_parent: "",
            max_level_bonus: 0,
            xp: 0,
            quest_rarity: "uncommon",
            favorite: false,
          },
          quantity: 1,
        },
      };

      const attributes = items[randomUUID] as Record<string, any>;
      if (
        "attributes" in attributes &&
        typeof attributes["attributes"] === "object"
      ) {
        const dict = attributes["attributes"] as Record<string, any>;

        for (const objective of QuestData[randomNum]["attributes"][
          "objectives"
        ]) {
          dict[`completion_${objective.toString()}`];
        }
      }

      await Accounts.updateOne(
        { accountId },
        { $push: { [`Season.${incrementNumber}.quests`]: items } }
      );
      await Accounts.updateOne(
        { accountId },
        {
          $set: {
            [`Season.${incrementNumber}.quest_manager.dailyLoginInterval`]:
              DateTime.now().toISO(),
          },
        }
      );

      return {
        questId: QuestData[Math.random()],
        items,
      };
    }
    incrementNumber += 1;
  }
  return createDefaultResponse([], profileId, rvn);
}
