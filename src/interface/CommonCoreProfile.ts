export interface CommonCoreProfile {
  _id: string;
  Update: string;
  Created: string;
  updated: string;
  rvn: number;
  wipeNumber: number;
  accountId: string;
  profileId: string;
  version: string;
  items: Record<string, any>;
  stats: {
    attributes: Record<string, any>;
  };
  commandRevision: number;
}
