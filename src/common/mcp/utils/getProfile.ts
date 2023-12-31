import fs from "node:fs";
import path from "node:path";

export function getProfile(accountId: string) {
  let userProfiles: any = {};
  const profilesDir = path.join(__dirname, "profiles");
  const profileFilePath = path.join(
    __dirname,
    "..",
    "utils",
    "profiles",
    `profile-${accountId}.json`
  );

  try {
    const data = fs.readFileSync(profileFilePath, "utf-8");
    userProfiles = JSON.parse(data);

    if (!userProfiles[accountId].profileChanges) {
      userProfiles[accountId].profileChanges = [];
    }
  } catch (error) {
    if (!fs.existsSync(profilesDir)) fs.mkdirSync(profilesDir);
  }

  return userProfiles;
}
