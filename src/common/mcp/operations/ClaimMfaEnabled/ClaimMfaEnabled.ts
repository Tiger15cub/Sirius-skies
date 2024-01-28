import { CommonCoreData } from "../../../../interface";
import Accounts from "../../../../models/Accounts";
import { sendErrorResponse } from "../../../../utils";
import { getCommonCore } from "../../utils/getProfile";
import ProfileCommonCore from "../QueryProfile/CommonCore";

export default async function ClaimMfaEnabled(
  res: any,
  profileId: string,
  accountId: string
) {
  const commonCore = await getCommonCore(accountId);

  if (commonCore.stats.attributes.mfa_enabled) {
    return sendErrorResponse(
      res,
      "OperationForbidden",
      "MFA is already enabled on your account."
    );
  }
}
