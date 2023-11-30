export interface EquipResult {
  errorCode?: string;
  message?: string;
  profileRevision?: number;
  profileId: string;
  profileChangesBaseRevision?: number;
  profileChanges?: {
    changeType: string;
    name: string;
    value: string;
  }[];
  profileCommandRevision?: number;
  serverTime?: Date;
  responseVersion?: number;
}
