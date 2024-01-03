import { Document, Schema, model } from "mongoose";

interface Character {
  items: string;
  activeVariants: any[];
}

interface Backpack {
  items: string;
  activeVariants: any[];
}

interface SkydiveContrail {
  items: string;
  activeVariants: any[];
}

interface Dance {
  items: string;
  activeVariants: any[];
}

interface LoadingScreen {
  items: string;
  activeVariants: any[];
}

interface MusicPack {
  items: string;
  activeVariants: any[];
}

interface Pickaxe {
  items: string;
  activeVariants: any[];
}

interface Glider {
  items: string;
  activeVariants: any[];
}

interface ItemWrap {
  items: string;
  activeVariants: any[];
}

interface Banner {
  banner_icon: string;
  banner_color: string;
}

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
  character: Character;
  backpack: Backpack;
  skydivecontrail: SkydiveContrail;
  dance: Dance;
  loadingscreen: LoadingScreen;
  musicpack: MusicPack;
  pickaxe: Pickaxe;
  glider: Glider;
  itemwrap: ItemWrap;
  Banner: Banner;
  items: any;
  CommonCore?: any;
  vbucks: number;
  BattleStars: number;
  gifts: any;
  banned: boolean;
  allowsGifts: boolean;
  optOutOfPublicLeaderboards: boolean;
  refundsUsed: number;
  refundCredits: number;
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
  character: {
    items: {
      type: String,
      default: "AthenaCharacter:cid_001_athena_commando_f_default",
    },
    activeVariants: {
      type: Array,
      default: [],
    },
  },
  backpack: {
    items: {
      type: String,
      default: "",
    },
    activeVariants: {
      type: Array,
      default: [],
    },
  },
  skydivecontrail: {
    items: {
      type: String,
      default: "",
    },
    activeVariants: {
      type: Array,
      default: [],
    },
  },
  dance: {
    items: {
      type: Array,
      default: ["", "", "", "", "", "", ""],
    },
    activeVariants: {
      type: Array,
      default: [],
    },
  },
  loadingscreen: {
    items: {
      type: String,
      default: "",
    },
    activeVariants: {
      type: Array,
      default: [],
    },
  },
  musicpack: {
    items: {
      type: String,
      default: "",
    },
    activeVariants: {
      type: Array,
      default: [],
    },
  },
  pickaxe: {
    items: {
      type: String,
      default: "",
    },
    activeVariants: {
      type: Array,
      default: [],
    },
  },
  glider: {
    items: {
      type: String,
      default: "",
    },
    activeVariants: {
      type: Array,
      default: [],
    },
  },
  itemwrap: {
    items: {
      type: Array,
      default: ["", "", "", "", "", "", ""],
    },
    activeVariants: {
      type: Array,
      default: [],
    },
  },
  Banner: {
    banner_icon: {
      type: String,
      default: "BRSeason01",
    },
    banner_color: {
      type: String,
      default: "DefaultColor1",
    },
  },
  items: {
    type: Array,
    default: [],
  },
  CommonCore: { type: Array, default: [] },
  vbucks: { type: Number, default: 0 },
  BattleStars: { type: Number, default: 0 },
  gifts: { type: Array, default: [] },
  banned: { type: Boolean, default: false },
  allowsGifts: { type: Boolean, default: true },
  optOutOfPublicLeaderboards: { type: Boolean, default: false },
  refundsUsed: { type: Number, default: 0 },
  refundCredits: { type: Number, default: 3 },
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
