import { CommonCoreProfile } from "../../interface";

export function getDefaultCommonCoreData(profileId: string): CommonCoreProfile {
  return {
    _id: "RANDOM",
    Update: "",
    Created: "2021-03-07T16:33:28.462Z",
    updated: new Date().toISOString(),
    rvn: 0,
    wipeNumber: 1,
    accountId: "",
    profileId,
    version: "no_version",
    items: {},
    stats: {
      attributes: {},
    },
    commandRevision: 5,
  };
}
