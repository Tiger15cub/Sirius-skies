import { Document, Schema, model } from "mongoose";

interface Stats {
  wins: number;
  kills: number;
  matchplayed: number;
}

interface Season {
  seasonNumber: number;
  book_level: number;
  level: number;
  bookXP: number;
  isBookPurchased: boolean;
  quests: { [key: string]: any }[];
  pinnedQuests?: { [key: string]: any }[];
  pinnedPartyQuests?: { [key: string]: any }[];
  quest_manager: QuestManager;
  battleStars: number;
}

interface QuestManager {
  dailyLoginInterval: string;
  dailyQuestRerolls: number;
}

const questManager: QuestManager = {
  dailyLoginInterval: new Date().toISOString(),
  dailyQuestRerolls: 1,
};

export const BanTypes = {
  NONE: 0,
  Matchmaking: 1,
  Permanently: 2,
  HWID: 3,
};

interface AccountsModel extends Document {
  discordId: string;
  accountId: string;
  athena: any;
  common_core: any;
  metadata: any;
  outpost0: any;
  theater0: any;
  BattleStars: number;
  gifts: any;
  banned: boolean;
  banned_type: number;
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
  Season: Season[] | any;
  profilerevision: number;
  baseRevision: number;
  RVN: number;
}

const accountsSchema = new Schema<AccountsModel>({
  discordId: { type: String, required: true, index: true },
  accountId: { type: String, required: true, index: true },
  athena: { type: Object, default: {} },
  common_core: { type: Object, default: {} },
  metadata: { type: Object, default: {} },
  theater0: { type: Object, default: {} },
  outpost0: { type: Object, default: {} },
  gifts: { type: Array, default: [] },
  banned: { type: Boolean, default: false },
  banned_type: {
    type: Number,
    enum: Object.values(BanTypes),
    default: BanTypes.NONE,
  },
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
  Season: {
    type: [
      {
        seasonNumber: { type: Number, default: 17 },
        level: { type: Number, default: 1 },
        bookLevel: { type: Number, default: 1 },
        battleStars: { type: Number, default: 0 },
        bookXP: { type: Number, default: 0 },
        isBookPurchased: { type: Boolean, default: false },
        quests: { type: Array, default: [] },
        pinnedQuests: { type: Array, default: [] },
        quest_manager: { type: Object, default: questManager },
      },
    ],
    default: [],
  },
  profilerevision: { type: Number, default: 1 },
  baseRevision: { type: Number, default: 0 },
  RVN: { type: Number, default: 1 },
});

const Accounts = model<AccountsModel>("Accounts", accountsSchema);

export default Accounts;
