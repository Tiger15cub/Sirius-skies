import { Router } from "express";
import { getEnv, sendErrorResponse } from "../utils";
import Users from "../models/Users";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { DecodedToken, VerificationResponse } from "../interface";

const TOKEN_EXPIRATION_TIME = 8 * 60 * 60 * 1000;
const REFRESH_EXPIRATION_TIME = 32 * 60 * 60 * 1000;
const CLIENT_SECRET = getEnv("CLIENT_SECRET");

const jwtCommonConfig = {
  clsvc: "fortnite",
  t: "s",
  mver: false,
  ic: true,
  iat: Math.floor(Date.now() / 1000),
  jti: crypto.randomBytes(32).toString("hex"),
};

export default function initRoute(router: Router): void {
  router.delete("/account/api/oauth/sessions/kill", (req, res) => {
    res.status(204).end();
  });

  router.get("/account/api/oauth/exchange", async (req, res) => {
    return res.status(204).json([]);
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
      session_id: decodedToken?.["jti"],
      token_type: "bearer",
      client_id: decodedToken?.["clid"],
      internal_client: true,
      client_service: "fortnite",
      account_id: req.query.account_id || req.body.account_id,
      expires_in: 28800,
      expires_at: new Date(
        new Date().getTime() + 8 * 60 * 60 * 1000
      ).toISOString(),
      auth_method: decodedToken?.["am"],
      display_name: req.query.display_name || req.body.display_name,
      app: "fortnite",
      in_app_id: req.query.in_app_id || req.body.in_app_id,
      device_id: decodedToken?.["dvid"],
    };

    res.json(verificationResponse).status(200);
  });

  router.delete("/account/api/oauth/sessions/kill/:accessToken", (req, res) => {
    res.status(204).end();
  });

  router.post("/account/api/oauth/token", async (req, res) => {
    try {
      const grantType: any = req.body.grant_type;
      const token = req.headers["authorization"]?.split(" ")[1];
      const clientId: string = Buffer.from(token as any, "base64")
        .toString()
        .split(":")[0];

      if (!clientId) {
        return sendErrorResponse(
          res,
          "InvalidClient",
          "Invalid or missing Authorization header. Please verify your headers."
        );
      }

      let displayName: string = req.body.username;
      let accountId: string = "";

      if (grantType === "password") {
        const user = await Users.findOne({ email: req.body.username }).lean();

        if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
          return sendErrorResponse(
            res,
            "InvalidCredentials",
            "Invalid email and/or password. Please check and try again."
          );
        }

        displayName = user.username;
        accountId = user.accountId;
      } else {
        return sendErrorResponse(
          res,
          "InvalidCredentials",
          "Invalid email and/or password. Please check and try again."
        );
      }

      if (grantType === "client_credentials") {
        if (!clientId) {
          return sendErrorResponse(res, "InvalidClientId", "Invalid Client Id");
        }

        const clientToken = jwt.sign(
          {
            p: crypto.randomBytes(128).toString("base64"),
            clid: clientId,
            exp: Math.floor(Date.now() / 1000) + 240 * 240,
            am: "client_credentials",
            ...jwtCommonConfig,
          },
          CLIENT_SECRET
        );

        return res.json({
          access_token: `eg1~${clientToken}`,
          expires_in: 28800,
          expires_at: new Date(
            Date.now() + TOKEN_EXPIRATION_TIME
          ).toISOString(),
          token_type: "bearer",
          client_id: clientId,
          internal_client: true,
          client_service: "fortnite",
        });
      }

      const refreshToken = jwt.sign(
        {
          sub: accountId,
          clid: clientId,
          exp: Math.floor(Date.now() / 1000) + REFRESH_EXPIRATION_TIME,
          am: grantType,
          ...jwtCommonConfig,
        },
        CLIENT_SECRET
      );

      const accessToken = jwt.sign(
        {
          app: "fortnite",
          sub: accountId,
          clid: clientId,
          dn: displayName,
          am: grantType,
          p: crypto.randomBytes(256).toString("base64"),
          iai: accountId,
          exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION_TIME,
          ...jwtCommonConfig,
        },
        CLIENT_SECRET
      );

      return res.json({
        access_token: `eg1~${accessToken}`,
        expires_in: 28800,
        expires_at: new Date(Date.now() + TOKEN_EXPIRATION_TIME).toISOString(),
        token_type: "bearer",
        account_id: accountId,
        client_id: clientId,
        internal_client: true,
        client_service: "fortnite",
        refresh_token: `eg1~${refreshToken}`,
        refresh_expires: REFRESH_EXPIRATION_TIME / 1000,
        refresh_expires_at: new Date(
          Date.now() + REFRESH_EXPIRATION_TIME
        ).toISOString(),
        displayName: displayName,
        app: "fortnite",
        in_app_id: accountId,
        device_id: "5dcab5dbe86a7344b061ba57cdb33c4f",
      });
    } catch {
      return res.status(400).json({
        errorCode: "errors.com.epicgames.account_token.not_found",
        message: "An error occurred. Please report this to us!",
      });
    }
  });
}
