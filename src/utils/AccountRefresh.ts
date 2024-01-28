import https from "https";
import axios from "axios";
import { getEnv } from "./getEnv";
import log from "./log";

export default async function AccountRefresh(
  accountId: string,
  displayName: string
) {
  const httpAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  const port = Number(getEnv("PORT"));

  await axios
    .post(
      `http://127.0.0.1:${port}/fortnite/api/game/v3/profile/${accountId}/client/emptygift`,
      {
        offerId: "e406693aa12adbc8b04ba7e6409c8ab3d598e8c3",
        currency: "MtxCurrency",
        currencySubType: "",
        expectedTotalPrice: "0",
        gameContext: "",
        receiverAccountIds: [accountId],
        giftWrapTemplateId: "GiftBox:GB_NewGiftBox",
        personalMessage: "test",
        accountId,
        playerName: displayName,
      },
      {
        httpsAgent: httpAgent,
      }
    )
    .then(function (response) {
      log.debug(JSON.stringify(response), "AccountRefresh");
    })
    .catch(function (error) {
      log.error(`Error: ${error}`, "AccountRefresh");
    });
}
