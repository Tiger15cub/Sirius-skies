import fs from "node:fs";
import path from "node:path";
import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";
import Accounts from "../../../../models/Accounts";
import { getSeason } from "../../../../utils";
import log from "../../../../utils/log";
import { AddItem, UpdateVbucks } from "../../utils/profile";

export default async function PurchaseCatalogEntry(
  accountId: string,
  profileId: string,
  rvn: number,
  req: any,
  res: any
) {
  try {
    const { currency, offerId } = req.body;
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

    const applyProfileChanges: any[] = [];
    const notifications: any[] = [];
    const multiUpdate: any[] = [];

    if (!account) {
      return res.status(404).json({
        errorMessage: "Account not found.",
      });
    }

    if (profileId === "profile0") return;

    if (currency === "MtxCurrency") {
      if (!offerId) {
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
        const id = offerId.split(":/")[1];
        let matchedStorefront = null;
        let isItemOwned = false;

        for (const storefronts of ["BRDailyStorefront", "BRWeeklyStorefront"]) {
          matchedStorefront = shop.catalogItems[storefronts].find(
            (storefront: any) => storefront.id === id
          );

          if (matchedStorefront) {
            break;
          }
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
        }

        for (const currentItem of account.items) {
          if (currentItem.templateId.includes(matchedStorefront.item)) {
            isItemOwned = true;
          }
        }

        if (!isItemOwned) {
          const itemUUID = uuid();

          for (const item of matchedStorefront.items) {
            multiUpdate.push({
              changeType: "itemAdded",
              itemId: itemUUID,
              item: {
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

            notifications.push({
              itemType: item.item,
              itemGuid: itemUUID,
              itemProfile: "athena",
              quantity: 1,
            });
          }

          account.vbucks -= matchedStorefront.price;

          applyProfileChanges.push({
            changeType: "itemQuantityChanged",
            itemId: "Currency:MtxPurchased",
            quantity: account.vbucks,
          });

          UpdateVbucks(account.vbucks, accountId);

          if (matchedStorefront.price > account.vbucks) {
            return res.status(400).json({
              errorType: "BadRequest",
              errorMessage:
                "You do not have enough V-Bucks to purchase this item.",
            });
          }

          isItemOwned = true;
        }
      } else {
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
      }
    } else {
      // TODO: Battle Pass
    }

    if (applyProfileChanges.length > 0) {
      rvn += 1;
      account.RVN += 1;
      account.baseRevision += 1;

      Accounts.updateOne({ accountId }, { $set: { RVN: account.RVN } });
      Accounts.updateOne(
        { accountId },
        { $set: { baseRevision: account.baseRevision } }
      );
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

    if (applyProfileChanges.length > 0) {
      for (const profileChanges of applyProfileChanges) {
        await UpdateVbucks(profileChanges.quantity, accountId);
      }

      for (const items of multiUpdate) {
        const { item } = items;

        await AddItem(item, accountId);
      }
    }
  } catch (error) {
    log.error(`${error}`, "PurchaseCatalogEntry");
  }
}
