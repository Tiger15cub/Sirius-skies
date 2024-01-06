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
