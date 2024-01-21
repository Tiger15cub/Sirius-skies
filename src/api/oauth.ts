import { NextFunction, Router } from "express";
import jwt, { Jwt, JwtPayload } from "jsonwebtoken";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import Users from "../models/Users";
import Accounts from "../models/Accounts";
import { getEnv, sendErrorResponse } from "../utils";
import { DecodedToken, VerificationResponse } from "../interface";
import log from "../utils/log";
import { Globals } from "../xmpp/types/XmppTypes";
import verifyToken from "../middleware/verifyToken";
import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";
import ExchangeCodes from "../models/ExchangeCodes";
import { findInIterable } from "../xmpp/functions/findInIterable";

export default function initRoute(router: Router, next: NextFunction): void {
  router.delete("/account/api/oauth/sessions/kill", (req, res) => {
    const { killType } = req.query;

    if (killType === "OTHERS_ACCOUNT_CLIENT_SERVICE") res.status(400).end();

    res.json(204).json({});
  });

  router.delete(
    "/account/api/oauth/sessions/kill/:accessToken",
    async (req, res) => {
      const { accessToken } = req.params;

      const accessTokenIndex = Globals.AccessTokens.findIndex(
        (token) => token.token === accessToken
      );

      if (accessTokenIndex !== -1) {
        const AccessToken = Globals.AccessTokens[accessTokenIndex];
        Globals.AccessTokens.splice(accessTokenIndex, 1);

        const Clients = findInIterable(
          Globals.Clients,
          (client) => client.token === AccessToken.token
        );

        if (Clients) {
          Clients.socket?.close();
        }
      }

      let clientTokenIndex = Globals.clientTokens.findIndex(
        (token) => token.token === accessToken
      );

      if (clientTokenIndex !== -1) {
        Globals.clientTokens.splice(clientTokenIndex, 1);
      }

      if (accessTokenIndex !== -1 || clientTokenIndex !== -1) {
        await Accounts.updateOne(
          { accountId: Globals.accountId },
          {
            $push: {
              accessToken: Globals.AccessTokens,
              clientToken: Globals.clientTokens,
            },
          }
        );
      }
      res.status(204);
    }
  );

  router.post("/account/api/oauth/token", async (req, res, nexterror) => {
    try {
      let grantType: any = req.body.grant_type;
      const token = req.headers["authorization"]?.split(" ")[1];
      let clientId: string = Buffer.from(token as any, "base64")
        .toString()
        .split(":")[0];
      let clientToken: any = "";
      let accessToken: any = "";
      let refreshToken: any = "";
      let displayName: string = req.body.username;
      const password: string = req.body.password;
      const refresh_token = req.body.refresh_token;
      const exchange_code = req.body.exchange_code;
      let accountId: string = "";

      let responseSent = false; // Flag to track if a response has been sent

      if (!clientId) {
        res.status(400).json({
          errorCode: "errors.com.epicgames.common.oauth.invalid_client",
          errorMessage:
            "It appears that your Authorization header may be invalid or not present, please verify that you are sending the correct headers.",
          messageVars: undefined,
          numericErrorCode: 1011,
          originatingService: "any",
          intent: "prod",
          error_description:
            "It appears that your Authorization header may be invalid or not present, please verify that you are sending the correct headers.",
          error: "invalid_client",
        });
        responseSent = true;
      }

      switch (grantType) {
        case "password":
          if (!password || !displayName) {
            res.status(400).json({
              errorCode: "errors.com.epicgames.common.oauth.invalid_request",
              errorMessage: "Username/password is required.",
              messageVars: undefined,
              numericErrorCode: 1013,
              originatingService: "any",
              intent: "prod",
              error_description: "Username/password is required.",
              error: "invalid_request",
            });
            responseSent = true;
          }

          const user = await Users.findOne({
            email: displayName,
          }).lean();

          if (!user) {
            res.status(404).json({
              errorCode:
                "errors.com.epicgames.account.invalid_account_credentials",
              errorMessage:
                "Your e-mail and/or password are incorrect. Please check them and try again.",
              messageVars: undefined,
              numericErrorCode: 18031,
              originatingService: "any",
              intent: "prod",
              error_description:
                "Your e-mail and/or password are incorrect. Please check them and try again.",
              error: "invalid_grant",
            });
            responseSent = true;
            return;
          }

          if (user.banned) {
            res.status(400).json({
              errorCode: "errors.com.epicgames.account.account_not_active",
              errorMessage: "You have been permanently banned from Fortnite.",
              messageVars: undefined,
              numericErrorCode: -1,
              originatingService: "any",
              intent: "prod",
              error_description:
                "You have been permanently banned from Fortnite.",
              error: "account_not_active",
            });
            responseSent = true;
          }

          if (bcrypt.compareSync(password, user.password)) {
            displayName = user.username;
            accountId = user.accountId;
          } else {
            return sendErrorResponse(
              res,
              "InvalidCredentials",
              "Invalid email and/or password. Please check and try again."
            );
          }
          break;

        case "client_credentials":
          clientToken = jwt.sign(
            {
              p: crypto.randomBytes(128).toString("base64"),
              clsvc: "fortnite",
              t: "s",
              mver: false,
              clid: clientId,
              ic: true,
              exp: Math.floor(Date.now() / 1000) + 240 * 240,
              am: "client_credentials",
              iat: Math.floor(Date.now() / 1000),
              jti: crypto.randomBytes(32).toString("hex"),
            },
            getEnv("CLIENT_SECRET")
          );

          const clientTokens = Globals.clientTokens.findIndex(
            (client) => client.ip === req.ip
          );

          if (clientTokens !== -1) {
            Globals.clientTokens.splice(clientToken, 1);
          }

          Globals.clientTokens.push({
            ip: req.ip,
            token: clientToken,
          });

          await Accounts.updateOne(
            { accountId },
            {
              $set: {
                clientToken: Globals.clientTokens,
              },
            }
          );

          res.json({
            access_token: `eg1~${clientToken}`,
            expires_in: 28800,
            expires_at: DateTime.utc()
              .plus({ hours: 8 })
              .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
            token_type: "bearer",
            account_id: accountId,
            client_id: clientId,
            internal_client: true,
            client_service: "true",
          });
          responseSent = true;
          break;

        case "refresh_token":
          // if (!refresh_token) {
          //   res.status(400).json({
          //     errorCode: "errors.com.epicgames.common.oauth.invalid_request",
          //     errorMessage: "RefreshToken is required.",
          //     messageVars: undefined,
          //     numericErrorCode: 1013,
          //     originatingService: "any",
          //     intent: "prod",
          //     error_description: "RefreshToken is required.",
          //     error: "invalid_request",
          //   });
          //   responseSent = true;
          // }

          // const refreshTokenObject =
          //   Globals.refreshTokens[
          //     Globals.refreshTokens.findIndex(
          //       (token) => token.token === refresh_token
          //     )
          //   ];

          // if (refreshTokenObject === undefined) {
          //   res.status(400).json({
          //     errorCode:
          //       "errors.com.epicgames.account.auth_token.invalid_refresh_token",
          //     errorMessage: `Sorry the refresh token '${refresh_token}' is invalid`,
          //     messageVars: undefined,
          //     numericErrorCode: 18036,
          //     originatingService: "any",
          //     intent: "prod",
          //     error_description: `Sorry the refresh token '${refresh_token}' is invalid`,
          //     error: "invalid_refresh_token",
          //   });
          //   responseSent = true;
          // } else {
          //   await Users.findOne({
          //     accountId: refreshTokenObject.accountId,
          //   }).lean();
          // }

          break;

        case "exchange_code":
          if (!exchange_code) {
            res.status(400).json({
              errorCode: "errors.com.epicgames.common.oauth.invalid_request",
              errorMessage: "exchange_code is required",
              messageVars: undefined,
              numericErrorCode: 1013,
              originatingService: "any",
              intent: "prod",
              error_description: "exchange_code is required",
              error: "invalid_request",
            });
            responseSent = true;
          }

          const exchangeCode =
            Globals.exchangeCodes[
              Globals.exchangeCodes.findIndex(
                (code: any) => code.exchange_code === exchange_code
              )
            ];

          if (exchangeCode === -1) {
            res.status(400).json({
              errorCode:
                "errors.com.epicgames.account.oauth.exchange_code_not_found",
              errorMessage:
                "Sorry the exchange code you supplied was not found. It is possible that it was no longer valid",
              messageVars: undefined,
              numericErrorCode: 18057,
              originatingService: "any",
              intent: "prod",
              error_description:
                "Sorry the exchange code you supplied was not found. It is possible that it was no longer valid",
              error: "exchange_code_not_found",
            });
            responseSent = true;
          }

          Globals.exchangeCodes.splice(
            Globals.exchangeCodes.findIndex(
              (code: any) => code.exchange_code === exchange_code
            ),
            1
          );

          await Users.findOne({
            accountId: exchangeCode.accountId,
          }).lean();

          break;

        default:
          res.status(400).json({
            errorCode:
              "errors.com.epicgames.common.oauth.unsupported_grant_type",
            errorMessage: `Unsupported grant type: ${grantType}`,
            messageVars: undefined,
            numericErrorCode: 1016,
            originatingService: "any",
            intent: "prod",
            error_description: `Unsupported grant type: ${grantType}`,
            error: "unsupported_grant_type",
          });
          responseSent = true;
      }

      refreshToken = jwt.sign(
        {
          sub: accountId,
          t: "r",
          clid: clientId,
          exp: Math.floor(Date.now() / 1000) + 1920 * 1920,
          am: grantType,
          jti: crypto.randomBytes(32).toString("hex"),
        },
        getEnv("CLIENT_SECRET")
      );

      accessToken = jwt.sign(
        {
          app: "fortnite",
          sub: accountId,
          mver: false,
          clid: clientId,
          dn: displayName,
          am: grantType,
          p: crypto.randomBytes(256).toString("base64"),
          iai: accountId,
          clsvc: "fortnite",
          t: "s",
          ic: true,
          exp: Math.floor(Date.now() / 1000) + 480 * 480,
          iat: Math.floor(Date.now() / 1000),
          jti: crypto.randomBytes(32).toString("hex"),
        },
        getEnv("CLIENT_SECRET")
      );

      if (!responseSent) {
        const refreshTokenIndex = Globals.refreshTokens.findIndex(
          (refresh) => refresh.accountId === accountId
        );

        if (refreshTokenIndex !== -1)
          Globals.refreshTokens.splice(refreshTokenIndex, 1);

        const accessTokenIndex = Globals.AccessTokens.findIndex(
          (token) => token.accountId === accountId
        );

        if (accessTokenIndex !== -1)
          Globals.AccessTokens.splice(accessTokenIndex, 1);

        Globals.refreshTokens.push({
          accountId: accountId,
        });

        Globals.AccessTokens.push({
          accountId: accountId,
          token: `eg1~${accessToken}`,
        });

        await Accounts.updateOne(
          { accountId },
          {
            $set: {
              refreshToken: Globals.refreshTokens,
              accessToken: Globals.AccessTokens,
            },
          }
        );

        res.json({
          access_token: `eg1~${accessToken}`,
          expires_in: 28800,
          expires_at: DateTime.utc()
            .plus({ hours: 8 })
            .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
          token_type: "bearer",
          account_id: accountId,
          client_id: clientId,
          internal_client: true,
          client_service: "fortnite",
          refresh_token: `eg1~${refreshToken}`,
          refresh_expires: 115200,
          refresh_expires_at: DateTime.utc()
            .plus({ hours: 32 })
            .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
          displayName: displayName,
          app: "fortnite",
          in_app_id: accountId,
          device_id: uuid().replace(/-/gi, ""),
        });
      }
    } catch (error) {
      let err: Error = error as Error;
      nexterror(err);
      log.error(`Error: ${err.message}`, "OAuthToken");
      nexterror(err);
      res.status(400).json({
        errorCode: "errors.com.epicgames.account_token.not_found",
        message: "An error occurred. Please report this to us!",
      });
    }
  });

  router.get("/account/api/oauth/verify", (req, res) => {
    const token = req.headers["authorization"]?.split("bearer ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const accessToken = token.replace("eg1~", "");
    const decodedToken = jwt.decode(accessToken) as DecodedToken;

    const verificationResponse: VerificationResponse = {
      token,
      session_id: decodedToken?.jti,
      token_type: "bearer",
      client_id: decodedToken?.clid,
      internal_client: true,
      client_service: "fortnite",
      account_id: decodedToken?.sub as string,
      expires_in: 28800,
      expires_at: DateTime.utc()
        .plus({ hours: 8 })
        .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
      auth_method: decodedToken?.["am"],
      display_name: decodedToken?.dn,
      app: "fortnite",
      in_app_id: decodedToken?.sub as string,
      device_id: decodedToken?.dvid,
    };

    res.json(verificationResponse).status(200);
  });

  router.get("/account/api/oauth/exchange", verifyToken, async (req, res) => {
    const existingExchangeCode = Globals.exchangeCodes.find(
      (item) => item.accountId === res.locals.accountId
    );

    if (existingExchangeCode) {
      const remainingExpiresInSeconds = Math.round(
        existingExchangeCode.expiresAt.diffNow().as("seconds")
      );

      res.json({
        expiresInSeconds: remainingExpiresInSeconds,
        code: existingExchangeCode.exchange_code,
        creatingClientId: existingExchangeCode.creatingClientId,
      });

      return;
    }

    const randomExchangeCode = uuid().replace(/-/g, "");

    const createdAt = DateTime.local();
    const expiresAt = DateTime.local().plus({ minutes: 5 });

    const expiresInSeconds = Math.round(
      expiresAt.diff(createdAt).as("seconds")
    );

    Globals.exchangeCodes.push({
      accountId: res.locals.user.accountId,
      exchange_code: randomExchangeCode,
      creatingClientId: getEnv("CLIENT_SECRET"),
      expiresAt: expiresAt,
    });

    await ExchangeCodes.create({
      accountId: res.locals.user.accountId,
      exchange_code: randomExchangeCode,
      creatingClientId: getEnv("CLIENT_SECRET"),
      expiresAt: expiresAt,
    });

    setTimeout(() => {
      const index = Globals.exchangeCodes.findIndex(
        (item) => item.exchange_code === randomExchangeCode
      );

      if (index !== -1) {
        Globals.exchangeCodes.splice(index, 1);
        log.custom(
          `Exchange code '${randomExchangeCode}' removed successfully.`,
          "ExchangeCodes"
        );
      }
    }, 300000);

    res.json({
      expiresInSeconds,
      code: randomExchangeCode,
      creatingClientId: getEnv("CLIENT_SECRET"),
    });
  });
}
