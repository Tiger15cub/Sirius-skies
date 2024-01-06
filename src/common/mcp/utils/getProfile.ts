import fs from "node:fs";
import path from "node:path";
import Accounts from "../../../models/Accounts";

export async function getProfile(accountId: string) {
  const existingProfile = await Accounts.findOne({ accountId }).lean();

  if (!existingProfile) {
    return { error: "not found" };
  }

  return existingProfile.athena;
}

export async function getCommonCore(accountId: string) {
  const existingProfile = await Accounts.findOne({ accountId }).lean();

  if (!existingProfile) {
    return { error: "not found" };
  }

  return existingProfile.common_core;
}
