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
  const commonCoreTemplate = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "template", "common_core", "template.json"),
      "utf-8"
    )
  );

  commonCoreTemplate.accountId = account.accountId;
  commonCoreTemplate.Created = DateTime.utc();
  commonCoreTemplate.Updated = DateTime.utc();
  commonCoreTemplate._id = uuid();

  return commonCoreTemplate;
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
