import Accounts from "../../../../models/Accounts";
import { getSeason } from "../../../../utils";
import fs from "node:fs";
import path from "node:path";
import log from "../../../../utils/log";
import { DateTime } from "luxon";

export default async function PurchaseCatalogEntry(
  accountId: string,
  profileId: string,
  rvn: number,
  req: any
) {
  const userAgent = req.headers["user-agent"];
  let season = getSeason(userAgent);

  const shop = JSON.parse(
    fs.readFileSync(
      path.join(
        __dirname,
        "..",
        "..",
        "..",
        "resources",
        "storefront",
        "shop.json"
      ),
      "utf-8"
    )
  );

  const { currency, offerId } = req.body;

  const multiUpdate: any[] = [];
  const notifications: any[] = [];
  const applyProfileChanges: any[] = [];

  const account = await Accounts.findOne({ accountId }).lean();

  if (!account)
    return {
      errorMessage: "Account not found.",
    };

  try {
    if (currency === "MtxCurrency") {
      if (offerId === null) return;
      else {
        if (offerId.includes(":/")) {
          let id: string = offerId.split(":/")[1];
          let matchedStorefront: any = null;
          let isItemOwned: boolean = false;

          for (const storefront of shop.catalogItems.BRDailyStorefront) {
            if (storefront.id === id) {
              matchedStorefront = storefront;
            }
          }

          for (const storefront of shop.catalogItems.BRWeeklyStorefront) {
            if (storefront.id === id) {
              matchedStorefront = storefront;
            }
          }

          if (!matchedStorefront) {
            return {
              statusCode: 400,
              errorName: "BadRequest",
              errorMessage: "Failed to get Item in Current Shop.",
            };
          } else {
            for (const currentItem of account.items) {
              if (currentItem.includes(matchedStorefront.item)) {
                isItemOwned = true;
              }
            }

            if (!isItemOwned) {
              notifications.push({
                itemType: matchedStorefront.id,
                itemGuid: matchedStorefront.item,
                itemProfile: "athena",
                quantity: 1,
              });

              multiUpdate.push({
                changeType: "itemAdded",
                itemId: matchedStorefront.id,
                item: {
                  templateId: matchedStorefront.item,
                  attributes: {
                    max_level_bonus: 0,
                    level: 1,
                    item_seen: false,
                    xp: 0,
                    variants: [],
                    favorite: false,
                  },
                  quantity: 1,
                },
              });

              for (const item of matchedStorefront.items) {
                notifications.push({
                  itemType: item.item,
                  itemGuid: item.id,
                  itemProfile: "athena",
                  quantity: 1,
                });

                multiUpdate.push({
                  changeType: "itemAdded",
                  itemId: item.item,
                  item: {
                    templateId: item.item,
                    attributes: {
                      max_level_bonus: 0,
                      level: 1,
                      item_seen: false,
                      xp: 0,
                      variants: [],
                      favorite: false,
                    },
                    quantity: 1,
                  },
                });
              }

              applyProfileChanges.push({
                changeType: "itemQuantityChanged",
                itemId: "Currency",
                quantity:
                  parseInt(account.vbucks.toString() ?? "0", 10) -
                  parseInt(matchedStorefront.price.toString() ?? "0", 10),
              });

              if (matchedStorefront.price > account.vbucks)
                return { statusCode: 400 };

              const items: Array<Record<string, any>> = [];

              items.push({
                [matchedStorefront.item]: {
                  templateId: matchedStorefront.item,
                  attributes: {
                    favorite: false,
                    item_seen: false,
                    level: 1,
                    max_level_bonus: 0,
                    variants: [],
                    xp: 0,
                  },
                  quantity: 1,
                },
              });

              for (const item of matchedStorefront.items) {
                items.push({
                  [item.item]: {
                    templateId: item.item,
                    attributes: {
                      favorite: false,
                      item_seen: false,
                      level: 1,
                      max_level_bonus: 0,
                      variants: [],
                      xp: 0,
                    },
                    quantity: 1,
                  },
                });
              }

              await Accounts.updateOne(
                { accountId },
                {
                  $set: {
                    ["vbucks"]:
                      parseInt(account.vbucks.toString() ?? "0", 10) -
                      parseInt(matchedStorefront.price.toString() ?? "0", 10),
                  },
                }
              );

              await Accounts.updateOne(
                { accountId },
                {
                  $push: {
                    ["items"]: items,
                  },
                }
              );
            } else {
              return {
                statusCode: 400,
                errorCode:
                  "errors.com.epicgames.modules.profiles.invalid_command",
                errorMessage: "You Already Own this Item",
              };
            }
          }
        } else {
          // TODO: BattlePass
        }
      }
    }

    return {
      profileRevision: account.profilerevision,
      profileId,
      profileChangesBaseRevision: account.baseRevision,
      profileChanges: applyProfileChanges,
      notifications: [
        {
          type: "CatalogPurchase",
          primary: true,
          lootResult: {
            items: notifications,
          },
        },
      ],
      profileCommandRevision: rvn,
      serverTime: DateTime.now().toISO(),
      multiUpdate: [
        {
          profileRevision: account.profilerevision,
          profileId: "athena",
          profileChangesBaseRevision: account.baseRevision,
          profileChanges: multiUpdate,
          profileCommandRevision: rvn,
        },
      ],
      response: 1,
    };
  } catch (error) {
    log.error(`${error}`, "PurchaseCatalogEntry");
  }
}
