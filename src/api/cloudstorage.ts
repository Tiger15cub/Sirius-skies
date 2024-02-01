import {
  Request,
  Response,
  NextFunction,
  Router,
} from "express";
import fs, { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import log from "../utils/log";
import verifyToken from "../middleware/verifyToken";
import { getSeason } from "../utils";
import crypto from "node:crypto";
import CloudStorageEntries, { ICloudStorageEntry } from "../models/CloudStorageEntries";

interface Custom extends Request {
  rawBody?: any;
}

function processHotfixes(hotfixes: ICloudStorageEntry[]): string {
  const sections: Map<string, Map<string, string[]>> = new Map();
  const addedSections: Set<string> = new Set();

  hotfixes.forEach(hotfix => {
    if (!sections.has(hotfix.section)) {
      sections.set(hotfix.section, new Map());
    }
    const section = sections.get(hotfix.section);
    if (section) {
      if (!section.has(hotfix.key)) {
        section.set(hotfix.key, []);
      }
      const key = section.get(hotfix.key);
      if (key) {
        key.push(hotfix.value);
      }
    }
  });

  const iniFile = [];
  for (const [section, keys] of sections) {
    if (addedSections.has(section)) continue; // Skip if section has already been added

    addedSections.add(section);
    iniFile.push(`[${section}]\n`);
    for (const [key, values] of keys) {
      iniFile.push(...values.map(value => `${key}=${value}\n`));
    }
  }

  return iniFile.join('');
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

    req.on("error", (err: any) => {
      reject(err);
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
      const hotfixes = await CloudStorageEntries.find({ enabled: true }).lean();

      const hotfixesByFile = hotfixes.reduce((acc: { [key: string]: typeof hotfixes[0][] }, hotfix) => {
        if (!acc[hotfix.file]) {
          acc[hotfix.file] = [];
        }
        acc[hotfix.file].push(hotfix);
        return acc;
      }, {});

      const files = Object.entries(hotfixesByFile).map(([file, matchingHotfixes]) => {
        const size = matchingHotfixes.reduce((acc, item) => acc + item.value.length, 0);

        return {
          uniqueFileName: file,
          filename: file,
          hash: "603E6907398C7E74E25C0AE8EC3A03FFAC7C9BB4",
          hash256: "973124FFC4A03E66D6A4458E587D5D6146F71FC57F359C8D516E0B12A50AB0D9",
          length: size,
          contentType: "text/plain",
          uploaded: "9999-9999-9999",
          storageType: "S3",
          doNotCache: false,
        };
      });

      res.json(files);
    } catch (error) {
      let err = error as Error;
      log.error(`Failed to get CloudStorage: ${err.message}`, "cloudstorage:system");
      res.status(500).send("Internal Server Error");
    }
  });

  router.get(
    "/fortnite/api/cloudstorage/system/:filename",
    async (req, res) => {
      res.contentType("application/octet-stream");

      const filename = req.params.filename;

      try {

        const hotfixEntries = await CloudStorageEntries.findOne({ file: filename, enabled: true }).lean();
        if (!hotfixEntries) {
          return res.status(404).send("Not Found");
        }

        const usefulHotfixes: ICloudStorageEntry[] = [];
        for (const hotfix of hotfixEntries.toObject()) {
          const { file, section, key, value } = hotfix;
          usefulHotfixes.push({ file, section, key, value } as ICloudStorageEntry);
        }

        const fileContents = processHotfixes(usefulHotfixes);

        res.type("text/plain").send(fileContents);
      } catch (error) {
        let err = error as Error;
        log.error(
          `Failed to get CloudStorage: ${err.message}`,
          `cloudstorage:system:${filename}`
        );
        res.status(500).send("Internal Server Error");
      }
    }
  );

  router.get(
    "/fortnite/api/cloudstorage/user/*/:file",
    verifyToken,
    async (req, res) => {
      const clientSettings = path.join(
        process.env.LOCALAPPDATA as string,
        "Sirius",
        "ClientSettings"
      );
      if (!existsSync(clientSettings)) await fs.mkdir(clientSettings);

      const { file } = req.params;

      if (file !== "ClientSettings.Sav") return res.status(204).end();

      const clientSettingsFile = path.join(
        clientSettings,
        `ClientSettings-${res.locals.user.accountId}.Sav`
      );

      if (existsSync(clientSettingsFile))
        return res.status(204).send(readFile(clientSettingsFile));

      res.status(204).end();
    }
  );

  router.get(
    "/fortnite/api/cloudstorage/user/:accountId",
    verifyToken,
    async (req, res) => {
      const clientSettings = path.join(
        process.env.LOCALAPPDATA as string,
        "Sirius",
        "ClientSettings"
      );
      if (!existsSync(clientSettings)) await fs.mkdir(clientSettings);

      const { accountId } = req.params;

      getSeason(req.headers["user-agent"]);

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
            accountId,
            doNotCache: false,
          },
        ]);
      }
      res.json([]).end();
    }
  );

  router.put(
    "/fortnite/api/cloudstorage/user/*/:file",
    verifyToken,
    getRequestBody,
    async (req: Custom, res) => {
      if (Buffer.byteLength(req.rawBody) >= 400000) {
        console.log("File size exceeds the maximum allowed limit (400KB).");
        res.status(403).json({
          error: "File size exceeds the maximum allowed limit (400KB).",
        });
      }

      const clientSettings = path.join(
        process.env.LOCALAPPDATA as string,
        "Sirius",
        "ClientSettings"
      );
      if (!existsSync(clientSettings)) await fs.mkdir(clientSettings);

      const { accountId } = req.params;

      getSeason(req.headers["user-agent"]);

      const clientSettingsFile = path.join(
        clientSettings,
        `ClientSettings-${accountId}.Sav`
      );

      await fs.writeFile(clientSettingsFile, req.rawBody, "latin1");

      res.status(204).end();
    }
  );
}
