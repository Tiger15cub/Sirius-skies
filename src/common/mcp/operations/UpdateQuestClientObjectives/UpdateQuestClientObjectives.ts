import { Response, Request } from "express";
import { sendErrorResponse } from "../../../../utils";
import { getProfile } from "../../utils/getProfile";
import log from "../../../../utils/log";
import { DateTime } from "luxon";
import Accounts from "../../../../models/Accounts";

export default async function UpdateQuestClientObjectives(
  res: Response,
  req: Request,
  accountId: string,
  profileId: string
) {
  try {
    const { advance } = req.body;
    if (!advance || !Array.isArray(advance)) {
      return sendErrorResponse(res, "BAD_REQUEST", "Invalid request body");
    }

    const profile = await getProfile(accountId);

    const applyProfileChanges: any[] = [];
    const multiUpdates: number[] = [];

    for (const index in advance) {
      if (Object.prototype.hasOwnProperty.call(advance, index)) {
        const statName = advance[index].statName.toLowerCase();
        for (const item in profile.items) {
          if (Object.prototype.hasOwnProperty.call(profile.items, item)) {
            const questTemplateId =
              profile.items[item].templateId.toLowerCase();
            if (questTemplateId.startsWith("quest:athenadaily")) {
              for (const questAttribute in profile.items[item].attributes) {
                if (
                  Object.prototype.hasOwnProperty.call(
                    profile.items[item].attributes,
                    questAttribute
                  ) &&
                  questAttribute.toLowerCase() === `completion_${statName}`
                ) {
                  multiUpdates.push(parseInt(item));
                  break;
                }
              }
            }
          }
        }
      }
    }

    for (let i = 0; i < multiUpdates.length; i++) {
      const itemIndex = multiUpdates[i];
      const attributes = profile.items[itemIndex].attributes;
      const statName = advance[i].statName.toLowerCase();
      const completionAttribute = `completion_${statName}`;

      attributes[completionAttribute] = advance[i].count;

      applyProfileChanges.push({
        changeType: "itemAttrChanged",
        itemId: itemIndex,
        attributeName: completionAttribute,
        attributeValue: advance[i].count,
      });

      const questState = attributes.quest_state.toLowerCase();
      if (questState !== "claimed") {
        let isQuestCompleted: boolean = false;
        for (const questAttribute in attributes) {
          if (questAttribute.toLowerCase().startsWith("completion_")) {
            if (attributes[questAttribute] === 0) {
              isQuestCompleted = true;
              break;
            }
          }
        }

        if (!isQuestCompleted) {
          attributes.quest_state = "claimed";

          applyProfileChanges.push({
            changeType: "itemAttrChanged",
            itemId: itemIndex,
            attributeName: "quest_state",
            attributeValue: attributes.quest_state,
          });
        }
      }
    }

    if (multiUpdates.length > 0 && applyProfileChanges.length > 0) {
      profile.rvn += 1;
      profile.commandRevision += 1;
      profile.Updated = DateTime.now().toISO();
    }

    res.json({
      profileRevision: profile.rvn || 0,
      profileId,
      profileChangesBaseRevision: profile.commandRevision || 0,
      profileChanges: multiUpdates,
      profileCommandRevision: profile.commandRevision,
      serverTime: DateTime.now().toISO(),
      responseVersion: 1,
    });

    if (multiUpdates.length > 0 && applyProfileChanges.length > 0) {
      await Accounts.updateOne(
        { accountId },
        {
          athena: profile,
        }
      );
    }
  } catch (error) {
    log.error(`An Error occurred: ${error}`, "UpdateQuestClientObjectives");
    res.status(500).json({ error: "Internal Server Error" });
  }
}
