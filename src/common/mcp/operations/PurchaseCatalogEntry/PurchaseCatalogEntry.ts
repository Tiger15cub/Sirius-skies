import Accounts from "../../../../models/Accounts";
import { getSeason } from "../../../../utils";
import fs from "node:fs";
import path from "node:path";
import log from "../../../../utils/log";
import { DateTime } from "luxon";
import MarkItemSeen from "../MarkItemSeen/MarkItemSeen";

export default async function PurchaseCatalogEntry(
  accountId: string,
  profileId: string,
  rvn: number,
  req: any,
  res: any
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
  const changeStream = Accounts.watch();

  const account = await Accounts.findOne({ accountId }).lean();

  if (!account)
    return res.status(404).json({
      errorMessage: "Account not found. ",
    });

  try {
    changeStream;

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
            return res.status(400).json({
              errorType: "BadRequest",
              errorMessage: "Failed to get item from the current shop.",
            });
          } else {
            for (const currentItem of account.items) {
              if (currentItem.templateId.includes(matchedStorefront.item)) {
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

              const Items = {
                templateId: matchedStorefront.item,
                attributes: {
                  favorite: false,
                  item_seen: false,
                  level: 1,
                  max_level_bonus: 0,
                  rnd_sel_cnt: 0,
                  variants: [],
                  xp: 0,
                },
                quantity: 1,
              };

              account.items[matchedStorefront.item] = Items;

              multiUpdate.push({
                changeType: "itemAdded",
                itemId: matchedStorefront.item,
                item: account.items[matchedStorefront.item],
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
                  itemId: matchedStorefront.item,
                  item: account.items[matchedStorefront.item],
                });
              }

              const newVbucksBalance =
                parseInt(account.vbucks.toString() ?? "0", 10) -
                parseInt(matchedStorefront.price.toString() ?? "0", 10);

              applyProfileChanges.push({
                changeType: "itemQuantityChanged",
                itemId: "Currency",
                quantity: newVbucksBalance,
              });

              if (matchedStorefront.price > account.vbucks)
                return res.status(400).json({ errorType: "BadRequest" });

              const items: Array<Record<string, any>> = [];

              items.push({
                [matchedStorefront.item]: {
                  templateId: matchedStorefront.item,
                  attributes: {
                    favorite: false,
                    item_seen: false,
                    level: 1,
                    max_level_bonus: 0,
                    rnd_sel_cnt: 0,
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
                      rnd_sel_cnt: 0,
                      variants: [],
                      xp: 0,
                    },
                    quantity: 1,
                  },
                });
              }
            } else {
              return res.status(400).json({
                errorCode:
                  "errors.com.epicgames.modules.profiles.invalid_command",
                errorMessage: "You Already Own this Item",
              });
            }
          }
        } else {
          const BattlePasses = [
            "Season10BattlePass",
            "Season9BattlePass",
            "Season8BattlePass",
            "Season7BattlePass",
            "Season6BattlePass",
            "Season5BattlePass",
          ];

          const currentSeason = season?.season as number;

          if (currentSeason < 11 && currentSeason >= 5) {
            for (const battlepass of BattlePasses) {
              const filePath = JSON.parse(
                fs.readFileSync(
                  path.join(
                    __dirname,
                    "..",
                    "..",
                    "..",
                    "resources",
                    "storefront",
                    "battlepasses",
                    `${battlepass}.json`
                  ),
                  "utf-8"
                )
              );

              for (const battlepassData of filePath.catalogEntries) {
                if (battlepassData.catalogEntries === offerId) {
                  let basePrice: number = parseInt(
                    battlepassData.prices[0].basePrice.toString() ?? "0"
                  );

                  if (basePrice > 0) {
                    return res.status(400).json({
                      errorCode:
                        "errors.com.epicgames.modules.profiles.invalid_command",
                      errorMessage: "An Error has occured.",
                    });
                  }

                  // TODO
                } else {
                  return res.status(400).json({
                    errorCode:
                      "errors.com.epicgames.modules.profiles.invalid_command",
                    errorMessage:
                      "There is currently no Battle Pass available for this season.",
                  });
                }
              }
            }
          }
        }
      }
    }

    if (applyProfileChanges.length > 0) {
      rvn += 1;
      account.RVN += 1;
      account.baseRevision += 1;

      Accounts.updateOne(
        { accountId },
        { $set: { RVN: parseInt(account.baseRevision.toString() ?? "0") + 1 } }
      );

      Accounts.updateOne(
        { accountId },
        {
          $set: {
            baseRevision: parseInt(account.baseRevision.toString() ?? "0") + 1,
          },
        }
      );

      for (const items of multiUpdate) {
        const { item } = items;

        for (const profileChanges of applyProfileChanges) {
          await Accounts.updateOne(
            { accountId },
            {
              $set: {
                vbucks: profileChanges.quantity.toString(),
              },
            }
          );
        }
        await Accounts.updateOne(
          {
            accountId,
          },
          {
            $set: {
              ["items"]: item,
            },
          }
        );

        console.log(account.items);
      }
    }

    if (multiUpdate.length > 0) {
      rvn += 1;
    }

    res.json({
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
      profileCommandRevision: account.RVN,
      serverTime: DateTime.now().toISO(),
      multiUpdate: [
        {
          profileRevision: account.profilerevision,
          profileId: "athena",
          profileChangesBaseRevision: account.baseRevision,
          profileChanges: multiUpdate,
          profileCommandRevision: account.RVN,
        },
      ],
      response: 1,
    });
  } catch (error) {
    log.error(`${error}`, "PurchaseCatalogEntry");
  }
}
