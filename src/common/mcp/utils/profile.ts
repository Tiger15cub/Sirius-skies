import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";

import fs from "node:fs";
import path from "node:path";

export async function CreateAthenaProfileItem(account: any) {
  const athenaTemplate = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "template", "athena", "template.json"),
      "utf-8"
    )
  );

  athenaTemplate.accountId = account.accountId;
  athenaTemplate.Created = DateTime.utc();
  athenaTemplate.Updated = DateTime.utc();
  athenaTemplate._id = uuid();

  return athenaTemplate;
}

export async function CreateCommonCoreProfileItem(account: any) {
  const common_core = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "template", "common_core", "template.json"),
      "utf-8"
    )
  );

  let newCommonCore: any = {
    stats: {
      attributes: {
        survey_data: {},
        personal_offers: {},
        intro_game_played: true,
        import_friends_claimed: {},
        mtx_purchase_history: {
          refundsUsed: 0,
          refundCredits: 3,
          purchases: [],
        },
        undo_cooldowns: [],
        mtx_affiliate_set_time: "",
        inventory_limit_bonus: 0,
        current_mtx_platform: "EpicPC",
        mtx_affiliate: "",
        forced_intro_played: "Coconut",
        weekly_purchases: {},
        daily_purchases: {},
        ban_history: {},
        in_app_purchases: {},
        permissions: [],
        undo_timeout: "min",
        monthly_purchases: {},
        gift_history: {},
        ban_status: {},
      },
    },
  };

  common_core.accountId = account.accountId;
  common_core.Created = DateTime.utc();
  common_core.Updated = DateTime.utc();
  common_core._id = uuid();

  newCommonCore.stats.attributes.survey_data = {};
  newCommonCore.stats.attributes.personal_offers = {};
  newCommonCore.stats.attributes.intro_game_played = true;
  newCommonCore.stats.attributes.import_friends_claimed = {};
  newCommonCore.stats.attributes.mtx_purchase_history.refundsUsed = 0;
  newCommonCore.stats.attributes.mtx_purchase_history.refundCredits = 3;
  newCommonCore.stats.attributes.mtx_purchase_history.purchases = [];
  newCommonCore.stats.attributes.undo_cooldowns = [];
  newCommonCore.stats.attributes.mtx_affiliate_set_time = "";
  newCommonCore.stats.attributes.inventory_limit_bonus = 0;
  newCommonCore.stats.attributes.current_mtx_platform = "EpicPC";
  newCommonCore.stats.attributes.mtx_affiliate = "";
  newCommonCore.stats.attributes.forced_intro_played = "Coconut";
  newCommonCore.stats.attributes.weekly_purchases = {};
  newCommonCore.stats.attributes.daily_purchases = {};
  newCommonCore.stats.attributes.ban_history = {};
  newCommonCore.stats.attributes.in_app_purchases = {};
  newCommonCore.stats.attributes.permissions = [];
  newCommonCore.stats.attributes.undo_timeout = "min";
  newCommonCore.stats.attributes.monthly_purchases = {};
  newCommonCore.stats.attributes.gift_history = {};
  newCommonCore.stats.attributes.ban_status = {};

  common_core.stats.attributes = {
    ...common_core.stats.attributes,
    ...newCommonCore.stats.attributes,
  };
  return common_core;
}

export async function CreateMetaDataProfileItem(account: any) {
  const metadataTemplate = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "template", "metadata", "template.json"),
      "utf-8"
    )
  );

  metadataTemplate.accountId = account.accountId;
  metadataTemplate.Created = DateTime.utc();
  metadataTemplate.Updated = DateTime.utc();
  metadataTemplate._id = uuid();

  return metadataTemplate;
}

export async function CreateOutpost0ProfileItem(account: any) {
  const outpost0Template = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "template", "outpost0", "template.json"),
      "utf-8"
    )
  );

  outpost0Template.accountId = account.accountId;
  outpost0Template.Created = DateTime.utc();
  outpost0Template.Updated = DateTime.utc();
  outpost0Template._id = uuid();

  return outpost0Template;
}

export async function CreateTheater0ProfileItem(account: any) {
  const theater0Template = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "template", "theater0", "template.json"),
      "utf-8"
    )
  );

  theater0Template.accountId = account.accountId;
  theater0Template.Created = DateTime.utc();
  theater0Template.Updated = DateTime.utc();
  theater0Template._id = uuid();

  return theater0Template;
}
