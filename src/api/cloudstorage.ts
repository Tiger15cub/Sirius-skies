import { Router, Request, Response, NextFunction } from "express";
import fs from "node:fs";
import path from "node:path";
import util from "node:util";
import log from "../utils/log";
import Users from "../models/Users";
import verifyToken from "../middleware/verifyToken";
import { getSeason } from "../utils";

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

interface Custom extends Request {
  rawBody?: Buffer;
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
        res.status(403).json({
          error: "File size exceeds the maximum allowed limit (400KB).",
        });
      }
    }

    let data: Buffer[] = [];
    req.rawBody = Buffer.concat(data);
    req.setEncoding("latin1");

    req.on("data", (chunk) => {
      req.rawBody += chunk;
      data.push(chunk);
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
      const fileNames = await readdir(cloudstorageDirPath);

      for (const fileName of fileNames) {
        if (path.extname(fileName) === ".ini") {
          const filePath = path.join(cloudstorageDirPath, fileName);
          const fileInfo = fs.statSync(filePath);

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
      res.contentType("application/octet-stream");

      const filename = req.params.filename;
      const filePath = path.join(
        __dirname,
        "..",
        "common",
        "resources",
        "cloudstorage",
        filename
      );

      try {
        if (fs.existsSync(filePath)) {
          const fileContents = await readFile(filePath, "utf-8");
          res.type("text/plain").send(fileContents);
        } else {
          res.status(404).send("File not found");
        }
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
    "/fortnite/api/cloudstorage/user/:id/:file",
    verifyToken,
    async (req, res) => {
      res.contentType("application/octet-stream");

      const id = req.params.id;
      const file = req.params.file;
      const filePath = path.join(
        process.env.LOCALAPPDATA as string,
        "Sirius",
        "ClientSettings",
        `ClientSettings-${id}.sav`
      );

      try {
        if (fs.existsSync(filePath)) {
          const fileContent = await readFile(filePath);
          res.type("application/octet-stream").send(fileContent);
        } else {
          res.status(204).send();
        }
      } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
      }
    }
  );

  router.put(
    "/fortnite/api/cloudstorage/user/:id/:file",
    verifyToken,
    getRequestBody,
    async (req: Custom, res) => {
      res.contentType("application/octet-stream");

      if (Buffer.byteLength(req.rawBody as Buffer) >= 400000)
        res.status(403).json({
          error: "File size exceeds the maximum allowed limit (400KB).",
        });

      const folderPath = path.join(
        process.env.LOCALAPPDATA as string,
        "Sirius",
        "Cloudstorage"
      );

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const filePath = path.join(
        folderPath,
        `ClientSettings-${req.params.id}.Sav`
      );
      await writeFile(filePath, req.rawBody as Buffer, "latin1");
    }
  );

  router.get(
    "/fortnite/api/cloudstorage/user/:id",
    verifyToken,
    async (req, res) => {
      res.contentType("application/json");

      const id = req.params.id;
      const filePath = path.join(
        process.env.LOCALAPPDATA as string,
        "Sirius",
        "ClientSettings",
        `ClientSettings-${id}.sav`
      );

      try {
        if (fs.existsSync(filePath)) {
          const fileContents = await readFile(filePath, "utf8");
          const fileInfo = await fs.promises.stat(filePath);

          res.json([
            {
              uniqueFilename: "ClientSettings.Sav",
              filename: "ClientSettings.Sav",
              hash: "603E6907398C7E74E25C0AE8EC3A03FFAC7C9BB4",
              hash256:
                "973124FFC4A03E66D6A4458E587D5D6146F71FC57F359C8D516E0B12A50AB0D9",
              length: fileContents.length,
              contentType: "application/octet-stream",
              uploaded: fileInfo.ctime,
              storageType: "S3",
              storageIds: {},
              accountId: id,
              doNotCache: false,
            },
          ]);
        }

        res.json([]);
      } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
      }
    }
  );
}
