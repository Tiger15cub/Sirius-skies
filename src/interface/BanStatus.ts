export interface BanStatus {
  bRequiresUserAck: boolean;
  banReasons: string[];
  bBanHasStarted: boolean;
  banStartTimeUtc: string;
  banDurationDays: number;
  additionalInfo: string;
  exploitProgramName: string;
  competitiveBanReason: string;
}
