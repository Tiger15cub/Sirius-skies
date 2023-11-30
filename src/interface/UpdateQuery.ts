export interface UpdateQuery {
  $inc: {
    profilerevision: number;
  };
  [key: string]: any;
}

export interface SetCosmeticLockerSlotUpdateQuery {
  $set: Record<string, any>;
}
