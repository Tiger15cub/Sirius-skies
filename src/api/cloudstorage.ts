import { Router } from "express";
import fs from "fs";
import path from "path";
import logger from "../utils/log";

export default function initRoute(router: Router): void {
  router.get("/fortnite/api/cloudstorage/system", (req, res) => {
    res.setHeader("content-type", "application/json");
    res.json([
      {
        uniqueFilename: "DefaultGame.ini",
        filename: "DefaultGame.ini",
        hash: "603E6907398C7E74E25C0AE8EC3A03FFAC7C9BB4",
        hash256:
          "973124FFC4A03E66D6A4458E587D5D6146F71FC57F359C8D516E0B12A50AB0D9",
        length: fs.readFileSync(
          path.join(
            __dirname,
            "..",
            "common",
            "resources",
            "cloudstorage",
            "DefaultGame.ini"
          )
        ).length,
        contentType: "text/plain",
        uploaded: "9999-9999-9999",
        storageType: "S3",
        doNotCache: false,
      },
      {
        uniqueFilename: "DefaultEngine.ini",
        filename: "DefaultEngine.ini",
        hash: "603E6907398C7E74E25C0AE8EC3A03FFAC7C9BB4",
        hash256:
          "973124FFC4A03E66D6A4458E587D5D6146F71FC57F359C8D516E0B12A50AB0D9",
        length: fs.readFileSync(
          path.join(
            __dirname,
            "..",
            "common",
            "resources",
            "cloudstorage",
            "DefaultEngine.ini"
          )
        ).length,
        contentType: "text/plain",
        uploaded: "9999-9999-9999",
        storageType: "S3",
        doNotCache: false,
      },
      {
        uniqueFilename: "DefaultRuntimeOptions.ini",
        filename: "DefaultRuntimeOptions.ini",
        hash: "603E6907398C7E74E25C0AE8EC3A03FFAC7C9BB4",
        hash256:
          "973124FFC4A03E66D6A4458E587D5D6146F71FC57F359C8D516E0B12A50AB0D9",
        length: fs.readFileSync(
          path.join(
            __dirname,
            "..",
            "common",
            "resources",
            "cloudstorage",
            "DefaultRuntimeOptions.ini"
          )
        ).length,
        contentType: "text/plain",
        uploaded: "9999-9999-9999",
        storageType: "S3",
        doNotCache: false,
      },
      {
        uniqueFilename: "DefaultInput.ini",
        filename: "DefaultInput.ini",
        hash: "603E6907398C7E74E25C0AE8EC3A03FFAC7C9BB4",
        hash256:
          "973124FFC4A03E66D6A4458E587D5D6146F71FC57F359C8D516E0B12A50AB0D9",
        length: fs.readFileSync(
          path.join(
            __dirname,
            "..",
            "common",
            "resources",
            "cloudstorage",
            "DefaultInput.ini"
          )
        ).length,
        contentType: "text/plain",
        uploaded: "9999-9999-9999",
        storageType: "S3",
        doNotCache: false,
      },
    ]);
    res.status(200);
  });

  router.get("/fortnite/api/cloudstorage/system/config", (req, res) => {
    res.setHeader("content-type", "application/json");
    res.json({
      lastUpdated: new Date().toISOString(),
      disableV2: true,
      isAuthenticated: true,
      enumerateFilesPath: "/api/cloudstorage/system",
      enableMigration: false,
      enableWrites: false,
      epicAppName: "Live",
      transports: {
        McpProxyTransport: {
          name: "McpProxyTransport",
          type: "ProxyStreamingFile",
          appName: "fortnite",
          isEnabled: false,
          isRequired: true,
          isPrimary: true,
          timeoutSeconds: 30,
          priority: 10,
        },
        McpSignatoryTransport: {
          name: "McpSignatoryTransport",
          type: "ProxySignatory",
          appName: "fortnite",
          isEnabled: false,
          isRequired: false,
          isPrimary: false,
          timeoutSeconds: 30,
          priority: 20,
        },
        DssDirectTransport: {
          name: "DssDirectTransport",
          type: "DirectDss",
          appName: "fortnite",
          isEnabled: true,
          isRequired: false,
          isPrimary: false,
          timeoutSeconds: 30,
          priority: 30,
        },
      },
    });
    res.status(200);
  });

  router.all("/fortnite/api/cloudstorage/system/:file", (req, res) => {
    const file = req.params.file;
    try {
      res.sendFile(
        path.join(__dirname, "..", "common", "resources", "cloudstorage", file)
      );
      res.status(200);
    } catch (err) {
      console.log(err);
      res.status(200);
    }
  });

  router.get(
    "/fortnite/api/cloudstorage/user/:accountId/:filename",
    (req, res) => {
      try {
        const filePath = path.join(
          __dirname,
          "..",
          "common",
          "resources",
          "cloudstorage",
          req.params.filename
        );
        const fileStream = fs.readFileSync(filePath);

        res.contentType("application/octet-stream");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${req.params.filename}"`
        );
        res.send(fileStream);
      } catch (error) {
        let err = error as Error;
        console.error(err.message, "CloudStorage");
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  );

  router.get("/fortnite/api/cloudstorage/user/:id/:file", (req, res) => {
    res.contentType("application/octet-stream");
    res.status(204).send();
  });

  router.put("/fortnite/api/cloudstorage/user/:id/:file", (req, res) => {
    res.contentType("application/octet-stream");
    res.status(204).send();
  });

  router.get("/fortnite/api/cloudstorage/user/:id", (req, res) => {
    res.contentType("application/json");
    res.status(204).json([]);
  });
}
