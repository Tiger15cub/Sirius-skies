import { Request, Response, NextFunction, Router } from "express";
import fs, { readdir, readFile } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import log from "../utils/log";
import verifyToken from "../middleware/verifyToken";
import { getSeason } from "../utils";
import crypto from "node:crypto";
import Cache from "../middleware/Cache";

interface Custom extends Request {
  rawBody?: any;
}

async function getRequestBody(
  req: Custom,
  res: Response,
  next: NextFunction
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (req.headers["content-length"]) {
      const contentLength = Number(req.headers["content-length"]);

      if (contentLength >= 400000) {
        console.log("File size exceeds the maximum allowed limit (400KB).");
        res.status(403).json({
          error: "File size exceeds the maximum allowed limit (400KB).",
        });
      }
    }

    req.rawBody = "";
    req.setEncoding("latin1");

    req.on("data", (chunk) => {
      req.rawBody += chunk;
    });

    req.on("end", () => {
      next();
    });
  });
}

export default function initRoute(router: Router): void {
  router.get("/fortnite/api/cloudstorage/system", async (req, res) => {
    res.contentType("application/json");

    const files: any[] = [];
    const cloudstorageDirPath = path.join(
      __dirname,
      "..",
      "common",
      "resources",
      "cloudstorage"
    );

    try {
      const fileNames = await readdir(cloudstorageDirPath);

      for (const fileName of fileNames) {
        if (path.extname(fileName) === ".ini") {
          const filePath = path.join(cloudstorageDirPath, fileName);
          const fileInfo = await fs.stat(filePath);

          files.push({
            uniqueFileName: path.basename(filePath),
            filename: path.basename(filePath),
            hash: "603E6907398C7E74E25C0AE8EC3A03FFAC7C9BB4",
            hash256:
              "973124FFC4A03E66D6A4458E587D5D6146F71FC57F359C8D516E0B12A50AB0D9",
            length: fileInfo.size,
            contentType: "text/plain",
            uploaded: "9999-9999-9999",
            storageType: "S3",
            doNotCache: false,
          });
        }
      }

      res.json(files);
    } catch (error) {
      let err = error as Error;
      log.error(
        `Failed to get CloudStorage: ${err.message}`,
        "cloudstorage:system"
      );
      res.status(500).send("Internal Server Error");
    }
  });

  router.get(
    "/fortnite/api/cloudstorage/system/:filename",
    async (req, res) => {
      const filename = req.params.filename;
      const filePath = path.join(
        __dirname,
        "..",
        "common",
        "resources",
        "cloudstorage",
        filename
      );

      if (existsSync(filePath)) {
        const fileContents = await readFile(filePath);
        res.send(fileContents);
      } else {
        res.status(404).send("File not found");
      }
    }
  );

  router.get(
    "/fortnite/api/cloudstorage/user/:accountId/:file",
    Cache,
    verifyToken,
    async (req, res) => {
      const clientSettings = path.join(
        process.env.LOCALAPPDATA as string,
        "Sirius",
        "ClientSettings"
      );

      if (!existsSync(clientSettings)) await fs.mkdir(clientSettings);

      const { file, accountId } = req.params;

      const clientSettingsFile = path.join(
        clientSettings,
        `ClientSettings-${accountId}.Sav`
      );

      if (file !== "ClientSettings.Sav" || !existsSync(clientSettingsFile))
        return res.status(404).json({
          errorCode: "errors.com.epicgames.cloudstorage.file_not_found",
          errorMessage: `Sorry, we couldn't find a settings file with the filename ${file} for the accountId ${accountId}`,
          messageVars: undefined,
          numericErrorCode: 12007,
          originatingService: "any",
          intent: "prod-live",
          error_description: `Sorry, we couldn't find a settings file with the filename ${file} for the accountId ${accountId}`,
          error: "fortnite",
        });

      try {
        res.contentType("application/octet-stream");
        res.status(200).sendFile(clientSettingsFile);
      } catch (err) {
        console.error("Error sending file:", err);
        res.status(500).send("Internal Server Error");
      }
    }
  );

  router.get(
    "/fortnite/api/cloudstorage/user/:accountId",
    Cache,
    verifyToken,
    async (req, res) => {
      const clientSettings = path.join(
        process.env.LOCALAPPDATA as string,
        "Sirius",
        "ClientSettings"
      );
      if (!existsSync(clientSettings)) await fs.mkdir(clientSettings);

      const { accountId } = req.params;

      const clientSettingsFile = path.join(
        clientSettings,
        `ClientSettings-${accountId}.Sav`
      );

      if (existsSync(clientSettingsFile)) {
        const file = await fs.readFile(clientSettingsFile, "latin1");
        const stats = await fs.stat(clientSettingsFile);

        return res.json([
          {
            uniqueFilename: "ClientSettings.Sav",
            filename: "ClientSettings.Sav",
            hash: crypto.createHash("sha1").update(file).digest("hex"),
            hash256: crypto.createHash("sha256").update(file).digest("hex"),
            length: Buffer.byteLength(file),
            contentType: "application/octet-stream",
            uploaded: stats.mtime,
            storageType: "S3",
            storageIds: {},
            accountId: accountId,
            doNotCache: false,
          },
        ]);
      }

      res.json([]);
    }
  );

  router.put(
    "/fortnite/api/cloudstorage/user/:accountId/:file",
    Cache,
    verifyToken,
    getRequestBody,
    async (req: Custom, res) => {
      if (Buffer.byteLength(req.rawBody) >= 400000) {
        console.log("File size exceeds the maximum allowed limit (400KB).");
        res.status(403).json({
          error: "File size exceeds the maximum allowed limit (400KB).",
        });
      }

      if (req.params.file !== "ClientSettings.Sav")
        return res.status(404).json({ error: "File not found." });

      const clientSettings = path.join(
        process.env.LOCALAPPDATA as string,
        "Sirius",
        "ClientSettings"
      );
      if (!existsSync(clientSettings)) await fs.mkdir(clientSettings);

      const clientSettingsFile = path.join(
        clientSettings,
        `ClientSettings-${res.locals.user.accountId}.Sav`
      );

      await fs.writeFile(clientSettingsFile, req.rawBody, "latin1");
      res.status(204).end();
    }
  );
}
