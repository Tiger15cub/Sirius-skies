import { DateTime } from "luxon";
import Accounts from "../../../models/Accounts";
import { createDefaultResponse, getEnv, getSeason } from "../../../utils";
import axios from "axios";

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

export let QuestUtil = {
  itemId: "",
  items: {} as Record<string, object>,
};

export default async function AddDailyQuest(
  profileId: string,
  accountId: string,
  req: any,
  rvn: number,
  uuid: string
) {
  const userAgent = req.headers["user-agent"];
  let season = getSeason(userAgent);

  const request = await axios.get(
    `http://localhost:${getEnv("PORT")}/sirius/quests/daily`
  );

  const { data } = request;
  const QuestData = data;

  const account = await Accounts.findOne({ accountId }).lean();

  if (!account)
    return {
      errorMessage: "Failed to find Account.",
    };

  if (!season) return { errorMessage: "Season is undefined or not found." };

  let randomNum: number = Math.floor(Math.random() * QuestData.length);
  let incrementNumber: number = 0;

  for (const data of account.Season) {
    if (data.seasonNumber === season.season) {
      for (const questItemKey in data.quests as QuestItem[]) {
        const questItem = (data.quests as QuestItem[])[questItemKey];
        while (
          QuestData[randomNum].templateId.toLowerCase() === questItem.templateId
        ) {
          randomNum = Math.floor(Math.random() * QuestData.length);
        }
      }

      const randomUUID = uuid;

      const items: Record<string, object> = {
        [randomUUID]: {
          templateId: QuestData[randomNum].templateId,
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
            xp: QuestData[randomNum].attributes.xp,
            quest_rarity: QuestData[randomNum].attributes.quest_rarity,
            favorite: false,
          },
          quantity: 1,
        },
      };

      let attributes = QuestData[randomNum];

      if (
        attributes &&
        attributes.hasOwnProperty("attributes") &&
        typeof attributes["attributes"] === "object"
      ) {
        let dict = attributes.attributes;

        for (let i of QuestData[randomNum]["attributes"]["objectives"]) {
          dict[`completion_${i.toString()}`] = 0;
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

      QuestUtil.itemId = QuestData[randomNum].templateId;
      QuestUtil.items = items;

      return QuestUtil;
    }
    incrementNumber += 1;
  }
  return createDefaultResponse([], profileId, rvn);
}
