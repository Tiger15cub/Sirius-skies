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

interface AccountsModel extends Document {
  discordId: string;
  accountId: string;
  athena: any;
  common_core?: any;
  BattleStars: number;
  gifts: any;
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
  Season: Season[] | any;
  profilerevision: number;
  baseRevision: number;
  RVN: number;
}

const accountsSchema = new Schema<AccountsModel>({
  discordId: { type: String, required: true },
  accountId: { type: String, required: true },
  athena: { type: Object, default: {} },
  common_core: { type: Object, default: {} },
  gifts: { type: Array, default: [] },
  banned: { type: Boolean, default: false },
  optOutOfPublicLeaderboards: { type: Boolean, default: false },
  accessToken: { type: Array, default: [] },
  refreshToken: { type: Array, default: [] },
  clientToken: { type: Array, default: [] },
  stats: {
    solos: {
      wins: {
        type: Number,
        default: 0,
      },
      kills: {
        type: Number,
        default: 0,
      },
      matchplayed: {
        type: Number,
        default: 0,
      },
    },
    duos: {
      wins: {
        type: Number,
        default: 0,
      },
      kills: {
        type: Number,
        default: 0,
      },
      matchplayed: {
        type: Number,
        default: 0,
      },
    },
    squad: {
      wins: {
        type: Number,
        default: 0,
      },
      kills: {
        type: Number,
        default: 0,
      },
      matchplayed: {
        type: Number,
        default: 0,
      },
    },
    ltm: {
      wins: {
        type: Number,
        default: 0,
      },
      kills: {
        type: Number,
        default: 0,
      },
      matchplayed: {
        type: Number,
        default: 0,
      },
    },
  },
  Season: {
    type: Array,
    default: [
      {
        seasonNumber: 17,
        level: 1,
        bookLevel: 1,
        battleStars: 0,
        bookXP: 0,
        isBookPurchased: false,
        quests: [],
        pinnedQuests: [],
        quest_manager: questManager,
      },
    ],
  },
  profilerevision: { type: Number, default: 1 },
  baseRevision: { type: Number, default: 0 },
  RVN: { type: Number, default: 1 },
});

const Accounts = model<AccountsModel>("Accounts", accountsSchema);

export default Accounts;
