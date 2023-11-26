import { CosmeticItems } from "./CosmeticItems";

export interface AthenaData {
  profileRevision: number;
  profileId: string;
  profileChangesBaseRevision: number;
  profileChanges: {
    changeType: string;
    _id: string;
    profile: {
      _id: string;
      Update: string;
      Created: string;
      updated: string;
      rvn: any;
      wipeNumber: number;
      accountId: string;
      profileId: string;
      version: string;
      items: CosmeticItems;
      stats: Record<string, any>;
      commandRevision: number;
    };
  }[];
  serverTime: string;
  profileCommandRevision: number;
  responseVersion: number;
}
