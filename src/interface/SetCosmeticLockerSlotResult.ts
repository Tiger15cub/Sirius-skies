export interface SetCosmeticLockerSlotResult {
  errorCode?: string;
  message?: string;
  profileId: string;
  profileChangesBaseRevision: number;
  profileChanges: {
    changeType: string;
    name: string;
    value: string;
  }[];
  profileCommandRevision: number;
  serverTime: Date;
  responseVersion: number;
}
