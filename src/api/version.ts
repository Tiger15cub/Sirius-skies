import { Router } from "express";
import log from "../utils/log";

interface ModuleInfo {
  cln: string;
  build: string;
  buildDate: Date;
  version: string;
  branch: string;
}

interface Response {
  app: string;
  serverDate: Date;
  overridePropertiesVersion: string;
  cln: string;
  build: string;
  moduleName: string;
  buildDate: Date;
  version: string;
  branch: string;
  modules: {
    EpicLightSwitchAccessControlCore: ModuleInfo;
    epicxmppapiv1base: ModuleInfo;
    epiccommoncore: ModuleInfo;
  };
}

export default function initRoute(router: Router): void {
  router.get("/fortnite/api/versioncheck", (req, res) => {
    res.json({
      type: "NO_UPDATE",
    });
  });

  router.get("/fortnite/api/versioncheck/:version", (req, res) => {
    log.log(`Version: ${req.params.version}`, "DEBUG", "magenta");

    res.json({
      type: "NO_UPDATE",
    });
  });

  router.get("/fortnite/api/version", (req, res) => {
    const response: Response = {
      app: "fortnite",
      serverDate: new Date(),
      overridePropertiesVersion: "unknown",
      cln: "17951730",
      build: "444",
      moduleName: "Fortnite-Core",
      buildDate: new Date(2021, 9, 27, 21, 0, 51, 697),
      version: "18.30",
      branch: "Release-18.30",
      modules: {
        EpicLightSwitchAccessControlCore: {
          cln: "17237679",
          build: "b2130",
          buildDate: new Date(2021, 7, 19, 18, 56, 8, 144),
          version: "1.0.0",
          branch: "trunk",
        },
        epicxmppapiv1base: {
          cln: "5131a23c1470acbd9c94fae695ef7d899c1a41d6",
          build: "b3595",
          buildDate: new Date(2019, 6, 30, 9, 11, 6, 587),
          version: "0.0.1",
          branch: "master",
        },
        epiccommoncore: {
          cln: "17909521",
          build: "3217",
          buildDate: new Date(2021, 9, 25, 18, 41, 12, 486),
          version: "3.0",
          branch: "TRUNK",
        },
      },
    };

    res.json(response);
  });
}
