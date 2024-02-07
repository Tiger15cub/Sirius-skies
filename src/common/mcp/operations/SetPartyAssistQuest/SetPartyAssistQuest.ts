import { Response, Request } from "express";
import { sendErrorResponse } from "../../../../utils";
import { getCommonCore, getProfile } from "../../utils/getProfile";
import log from "../../../../utils/log";
import { DateTime } from "luxon";
import Accounts from "../../../../models/Accounts";

export default async function SetPartyAssistQuest(
  req: Request,
  res: Response,
  accountId: string
) {
  try {
    const userProfiles = await getProfile(accountId);
    const account = await Accounts.findOne({ accountId });
    const applyProfileChanges: any[] = [];

    const { questToPinAsPartyAssist } = req.body;

    if (!account) return res.status(404).json({ error: "Account not Found." });

    if (userProfiles.stats.attributes.hasOwnProperty("party_assist_quest")) {
      userProfiles.stats.attributes.party_assist_quest =
        questToPinAsPartyAssist;

      applyProfileChanges.push({
        changeType: "statModified",
        name: "party_assist_quest",
        value: userProfiles.stats.attributes.party_assist_quest,
      });
    }

    if (applyProfileChanges.length > 0) {
      userProfiles.rvn += 1;
      userProfiles.commandRevision += 1;
      userProfiles.Updated = DateTime.now().toISO();
    }

    res.json({
      profileRevision: userProfiles.rvn || 0,
      profileId: "athena",
      profileChangesBaseRevision: account.baseRevision || 0,
      profileChanges: applyProfileChanges,
      profileCommandRevision: userProfiles.baseRevision || 0,
      serverTime: DateTime.now().toISO(),
      responseVersion: 1,
    });

    if (applyProfileChanges.length > 0) {
      await account.updateOne({ $set: { athena: userProfiles } });
    }
  } catch (error) {
    log.error(`Error in SetPartyAssistQuest: ${error}`, "SetPartyAssistQuest");
    return res.status(500).json({ error: "Internal server error." });
  }
}
