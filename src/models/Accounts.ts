import { Document, Schema, model } from "mongoose";
import { SpeedGooseCacheAutoCleaner } from "speedgoose";

interface Stats {
  wins: number;
  kills: number;
  matchplayed: number;
}

interface AccountsModel extends Document {
  discordId: string;
  accountId: string;
  athena: any;
  common_core: any;
  metadata: any;
  outpost0: any;
  theater0: any;
  collection_book_schematics0: any;
  collection_book_people0: any;
  banned: boolean;
  optOutOfPublicLeaderboards: boolean;
  accessToken: any;
  refreshToken: any;
  clientToken: any;
  stats: {
    solos: Stats;
    duos: Stats;
    squad: Stats;
    ltm: Stats;
  };
  profilerevision: number;
  baseRevision: number;
  RVN: number;
}

const accountsSchema = new Schema<AccountsModel>({
  discordId: { type: String, required: true, index: true },
  accountId: { type: String, required: true, index: true },
  banned: { type: Boolean, default: false, index: true },
  athena: { type: Object, default: {} },
  common_core: { type: Object, default: {} },
  metadata: { type: Object, default: {} },
  theater0: { type: Object, default: {} },
  outpost0: { type: Object, default: {} },
  collection_book_schematics0: { type: Object, default: {} },
  collection_book_people0: { type: Object, default: {} },
  optOutOfPublicLeaderboards: { type: Boolean, default: false },
  accessToken: { type: Array, default: [] },
  refreshToken: { type: Array, default: [] },
  clientToken: { type: Array, default: [] },
  stats: {
    solos: {
      wins: { type: Number, default: 0 },
      kills: { type: Number, default: 0 },
      matchplayed: { type: Number, default: 0 },
    },
    duos: {
      wins: { type: Number, default: 0 },
      kills: { type: Number, default: 0 },
      matchplayed: { type: Number, default: 0 },
    },
    squad: {
      wins: { type: Number, default: 0 },
      kills: { type: Number, default: 0 },
      matchplayed: { type: Number, default: 0 },
    },
    ltm: {
      wins: { type: Number, default: 0 },
      kills: { type: Number, default: 0 },
      matchplayed: { type: Number, default: 0 },
    },
  },
  profilerevision: { type: Number, default: 1 },
  baseRevision: { type: Number, default: 0 },
  RVN: { type: Number, default: 1 },
});

accountsSchema.plugin(SpeedGooseCacheAutoCleaner);

const Accounts = model<AccountsModel>("Accounts", accountsSchema);

export default Accounts;
