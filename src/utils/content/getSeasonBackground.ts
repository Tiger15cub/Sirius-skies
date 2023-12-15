export default function getSeasonBackground(
  buildUpdate: string | number | undefined,
  backgrounds: any[]
) {
  switch (buildUpdate) {
    case "10":
      backgrounds = [
        {
          stage: "seasonx",
          _type: "DynamicBackground",
          key: "lobby",
        },
        {
          stage: "seasonx",
          _type: "DynamicBackground",
          key: "vault",
        },
      ];
      break;

    case "11.31":
    case "11.30":
      backgrounds = [
        {
          stage: "winter19",
          _type: "DynamicBackground",
          key: "lobby",
        },
        {
          stage: "winter19",
          _type: "DynamicBackground",
          key: "vault",
        },
      ];
      break;
  }
}
