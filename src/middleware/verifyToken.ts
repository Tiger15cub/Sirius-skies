import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getEnv, sendErrorResponse } from "../utils";
import { Globals } from "../xmpp/types/XmppTypes";
import Users from "../models/Users";
import log from "../utils/log";

export default async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { headers, originalUrl } = req;
  const { authorization } = headers;

  const servicePath = originalUrl.split("/")[1];
  const reqService = ["account", "com.epicgames.account.public"].includes(
    servicePath
  )
    ? undefined
    : servicePath;

  try {
    if (
      !authorization ||
      !authorization.startsWith("bearer ") ||
      !authorization.startsWith("bearer eg1~")
    ) {
      throw new Error("Invalid authorization format");
    }

    const token = authorization.replace("bearer eg1~", "");
    const decodedToken = jwt.decode(token);

    const user = await Users.findOne({ accountId: decodedToken?.sub }).lean();

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    if (user.banned) {
      sendErrorResponse(
        res,
        "errors.com.epicgames.account.account_not_active",
        "You have been permanently banned from Fortnite."
      );
    }

    next();
  } catch (error) {
    const isTokenError = error instanceof jwt.JsonWebTokenError;
    const errorCode = isTokenError
      ? "errors.com.epicgames.common.authentication.token_verification_failed"
      : "errors.com.epicgames.common.authentication.authentication_failed";

    const errorMessage = isTokenError
      ? "Sorry, we couldn't validate your token. Please try again with a new token."
      : `Authentication failed for ${originalUrl.replace("/account", "")}`;

    const numericErrorCode = isTokenError ? 1014 : 1032;
    const messageVars = isTokenError
      ? [null]
      : [originalUrl.replace("/account", "")];

    res.status(401).json({
      errorCode,
      errorMessage,
      messageVars,
      numericErrorCode,
      originatingService: reqService,
      intent: "prod",
    });
  }
}
