import fs from "node:fs";
import log from "../../../../utils/log";
import { CommonCoreData, CommonCoreProfile } from "../../../../interface";
import { getDefaultCommonCoreData, mapPurchasesData } from "../../../../utils";
import { getCommonCore } from "../../utils/getProfile";

export default async function ProfileCommonCore(
  Account: any,
  accountId: string,
  profileId: string,
  simpleProfile?: boolean
): Promise<CommonCoreProfile | CommonCoreData> {
  try {
    let [account] = await Promise.all([Account.findOne({ accountId }).lean()]);

    const common_core = await getCommonCore(accountId);

    if (!account) {
      return simpleProfile
        ? getDefaultCommonCoreData(profileId)
        : getDefaultCommonCoreData(profileId);
    }

    if (!account.baseRevision) {
      await Account.updateOne(
        { accountId },
        { baseRevision: account.profilerevision - 1 }
      );
      account = await Account.findOne({ accountId }).lean().exec();
    }

    const commonCoreData: CommonCoreData = {
      profileRevision: account.profilerevision || 0,
      profileId,
      profileChangesBaseRevision: account.BaseRevision || 0,
      profileChanges: [
        {
          changeType: "fullProfileUpdate",
          _id: "RANDOM",
          profile: {
            ...common_core,
          },
        },
      ],
      serverTime: new Date().toISOString(),
      profileCommandRevision: account.profilerevision,
      responseVersion: 1,
    };

    const commonCore = require("../../../resources/mcp/Common_Core.json");
    commonCoreData.profileChanges[0].profile.items = {
      ...commonCoreData.profileChanges[0].profile.items,
      ...commonCore,
    };

    if (simpleProfile) return commonCoreData.profileChanges[0].profile;
    return commonCoreData;
  } catch (error) {
    let err: Error = error as Error;
    log.error(
      `Error in ProfileCommonCore: ${err.message}`,
      "ProfileCommonCore"
    );
    throw error;
  }
}
