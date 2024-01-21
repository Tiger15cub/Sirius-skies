import { Router } from "express";

export default function initRoute(router: Router): void {
  router.post("/region/check", (req, res) => {
    res.status(201).json({
      content_id: "AF9yLAAsklQALFTy",
      allowed: true,
      resolved: true,
      limit: "Res=656",
    });
  });

  router.get("/region", (req, res) => {
    res.json({
      continent: {
        code: "EU",
        geoname_id: 6255148,
        names: {
          de: "Europa",
          en: "Europe",
          es: "Europa",
          fr: "Europe",
          ja: "ヨーロッパ",
          "pt-BR": "Europa",
          ru: "Европа",
          "zh-CN": "欧洲",
        },
      },
      country: {
        geoname_id: 2635167,
        is_in_european_union: false,
        iso_code: "GB",
        names: {
          de: "Vereinigtes Königreich",
          en: "United Kingdom",
          es: "Reino Unido",
          fr: "Royaume Uni",
          ja: "英国",
          "pt-BR": "Reino Unido",
          ru: "Британия",
          "zh-CN": "英国",
        },
      },
      subdivisions: [
        {
          geoname_id: 6269131,
          iso_code: "ENG",
          names: {
            de: "England",
            en: "England",
            es: "Inglaterra",
            fr: "Angleterre",
            ja: "イングランド",
            "pt-BR": "Inglaterra",
            ru: "Англия",
            "zh-CN": "英格兰",
          },
        },
        {
          geoname_id: 3333193,
          iso_code: "LDN",
          names: {
            en: "London",
          },
        },
      ],
    });
  });
}
