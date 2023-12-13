import { CommonCoreData } from "../../../../interface";
import Accounts from "../../../../models/Accounts";
import { sendErrorResponse } from "../../../../utils";
import ProfileCommonCore from "../QueryProfile/CommonCore";

export default async function ClaimMfaEnabled(
  res: any,
  profileId: string,
  accountId: string
) {
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
