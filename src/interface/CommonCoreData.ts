import { CommonCoreProfile } from "./CommonCoreProfile";

export interface CommonCoreData {
  profileRevision: number;
  profileId: string;
  profileChangesBaseRevision: number;
  profileChanges: Array<{
    changeType: string;
    _id: string;
    profile: CommonCoreProfile;
  }>;
  serverTime: string;
  profileCommandRevision: number;
  responseVersion: number;
}
