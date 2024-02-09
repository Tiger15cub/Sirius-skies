import { Response } from "express";
import { getMeta, getProfile } from "../../utils/getProfile";
import Accounts from "../../../../models/Accounts";
import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";

export default async function MetaData(accountId: string, res: Response) {
  const userProfiles = await getMeta(accountId);
  const athena = await Accounts.findOne({ accountId });
  const applyProfileChanges: any[] = [];

  if (!athena) {
    return res
      .json({
        errorCode:
          "errors.com.sirius.backend.common.mcp.account_or_user.not_found",
        message: "Account or User not found.",
      })
      .status(404);
  }

  applyProfileChanges.push({
    changeType: "fullProfileUpdate",
    _id: uuid(),
    profile: {
      ...userProfiles,
    },
  });

  userProfiles.rvn += 1;
  userProfiles.commandRevision += 1;
  userProfiles.Updated = DateTime.now().toISO();

  res.json({
    profileRevision: userProfiles.rvn || 0,
    profileId: "metadata",
    profileChangesBaseRevision: athena.baseRevision || 0,
    profileChanges: applyProfileChanges,
    profileCommandRevision: userProfiles.commandRevision,
    serverTime: DateTime.now().toISO(),
    responseVersion: 1,
  });

  await athena
    .updateOne(
      { accountId },
      {
        $set: {
          metadata: userProfiles,
        },
      }
    )
    .cacheQuery();
}
