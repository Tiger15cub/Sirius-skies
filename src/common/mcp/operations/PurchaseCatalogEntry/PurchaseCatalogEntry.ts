import fs from "node:fs";
import path from "node:path";
import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";
import Accounts from "../../../../models/Accounts";
import { getSeason } from "../../../../utils";
import log from "../../../../utils/log";
import { getCommonCore, getProfile } from "../../utils/getProfile";

interface ProfileChange {
  changeType: string;
  itemId: string;
  quantity: number;
}

export default async function PurchaseCatalogEntry(
  accountId: string,
  profileId: string,
  rvn: number,
  req: any,
  res: any
) {
  try {
    const { currency, offerId, purchaseQuantity } = req.body;
    const userAgent = req.headers["user-agent"];
    const season = getSeason(userAgent);

    const shopPath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "resources",
      "storefront",
      "shop.json"
    );

    const shop = JSON.parse(fs.readFileSync(shopPath, "utf-8"));

    const account = await Accounts.findOne({ accountId }).lean();

    const applyProfileChanges: Object[] = [];
    const notifications: any[] = [];
    const multiUpdate: any[] = [];

    if (!account) {
      return res.status(404).json({
        errorMessage: "Account not found.",
      });
    }

    const userProfiles: any = await getProfile(accountId);
    const commonCore: any = await getCommonCore(accountId);

    if (currency === "MtxCurrency" && profileId === "common_core") {
      if (!offerId || offerId === null) {
        return res.status(400).json({
          errorCode: "errors.com.epicgames.fortnite.id_invalid",
          errorMessage: `Offer ID (${offerId}) not found.`,
          messageVars: undefined,
          numericErrorCode: 1040,
          originatingService: "any",
          intent: "prod",
          error_description: `Offer ID (${offerId}) not found.`,
          error: undefined,
        });
      }

      if (offerId.includes(":/")) {
        const id: string = offerId.split(":/")[1];
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

        if (purchaseQuantity < 1) {
          return res.status(400).json({
            errorCode: "errors.com.epicgames.validation.validation_failed",
            errorMessage:
              "Validation Failed. 'purchaseQuantity' is less than 1.",
            messageVars: undefined,
            numericErrorCode: 1040,
            originatingService: "any",
            intent: "prod",
            error_description:
              "Validation Failed. 'purchaseQuantity' is less than 1.",
            error: undefined,
          });
        }

        if (!matchedStorefront) {
          return res.status(400).json({
            errorCode: "errors.com.epicgames.fortnite.invalid_item_id",
            errorMessage: "Failed to retrieve item from the current shop.",
            messageVars: undefined,
            numericErrorCode: 1040,
            originatingService: "any",
            intent: "prod",
            error_description: "Failed to retrieve item from the current shop.",
            error: undefined,
          });
        } else {
          if (isItemOwned) {
            return res.status(400).json({
              errorCode: "errors.com.epicgames.offer.already_owned",
              errorMessage: "You have already bought this item before.",
              messageVars: undefined,
              numericErrorCode: 1040,
              originatingService: "any",
              intent: "prod",
              error_description: "You have already bought this item before.",
              error: undefined,
            });
          } else {
            const itemUUID = uuid();

            for (const item of matchedStorefront.items) {
              if (item.item === userProfiles.items[item.item]) {
                return res.status(400).json({
                  errorCode: "errors.com.epicgames.offer.already_owned",
                  errorMessage: "You have already bought this item before.",
                  messageVars: undefined,
                  numericErrorCode: 1040,
                  originatingService: "any",
                  intent: "prod",
                  error_description:
                    "You have already bought this item before.",
                  error: undefined,
                });
              }

              userProfiles.items[item.item] = {
                templateId: item.item,
                attributes: {
                  item_seen: false,
                  variants: [],
                },
                quantity: 1,
              };

              multiUpdate.push({
                changeType: "itemAdded",
                itemId: itemUUID,
                item: userProfiles.items[item.item],
              });

              notifications.push({
                itemType: item.item,
                itemGuid: itemUUID,
                itemProfile: "athena",
                quantity: 1,
              });
            }

            userProfiles.items[matchedStorefront.item] = {
              templateId: matchedStorefront.item,
              attributes: {
                item_seen: false,
                variants: [],
              },
              quantity: 1,
            };

            multiUpdate.push({
              changeType: "itemAdded",
              itemId: itemUUID,
              item: userProfiles.items[matchedStorefront.item],
            });

            notifications.push({
              itemType: matchedStorefront.item,
              itemGuid: itemUUID,
              itemProfile: "athena",
              quantity: 1,
            });
          }

          for (const item in commonCore.items) {
            commonCore.items[item].quantity -= matchedStorefront.price;

            applyProfileChanges.push({
              changeType: "itemQuantityChanged",
              itemId: item,
              quantity: commonCore.items[item].quantity,
            });

            isItemOwned = true;
          }
        }

        if (!isItemOwned && matchedStorefront.price > 0) {
          return res.status(400).json({
            errorCode: "errors.com.epicgames.currency.mtx.insufficient",
            errorMessage: `You can not afford this item (${matchedStorefront.price}).`,
            messageVars: undefined,
            numericErrorCode: 1040,
            originatingService: "any",
            intent: "prod",
            error_description: `You can not afford this item (${matchedStorefront.price}).`,
            error: undefined,
          });
        }
      }
    } else {
      // TODO: Battle Pass
    }

    if (applyProfileChanges.length > 0) {
      userProfiles.rvn += 1;
      userProfiles.commandRevision += 1;
      userProfiles.Updated = DateTime.utc().toISO();
    }

    if (multiUpdate.length > 0) {
      rvn += 1;
      userProfiles.rvn += 1;
      userProfiles.commandRevision += 1;
      userProfiles.Updated = DateTime.utc().toISO();

      Accounts.updateOne({ accountId }, { $set: { RVN: account.RVN } });
      Accounts.updateOne(
        { accountId },
        { $set: { baseRevision: account.baseRevision } }
      );
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
          profileRevision: userProfiles.rvn,
          profileId: "athena",
          profileChangesBaseRevision: account.baseRevision,
          profileChanges: multiUpdate,
          profileCommandRevision: userProfiles.commandRevision,
        },
      ],
      response: 1,
    });

    if (applyProfileChanges.length > 0) {
      await Accounts.updateMany(
        { accountId },
        {
          $set: {
            common_core: commonCore,
            athena: userProfiles,
          },
        }
      );
    }
  } catch (error) {
    log.error(`${error}`, "PurchaseCatalogEntry");
  }
}
