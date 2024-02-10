export default function getSeasonBackground(
  buildUpdate: string | number | undefined,
  defaultBuild: number,
  backgrounds: any[]
) {
  switch (buildUpdate) {
    case "10":
      backgrounds.push([
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
      ]);
      break;

    case "11.31":
    case "11.30":
      backgrounds.push([
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
      ]);
      break;

    case "14.60":
      backgrounds.push([
        {
          stage: "season14",
          _type: "DynamicBackground",
          key: "lobby",
        },
        {
          stage: "season14",
          _type: "DynamicBackground",
          key: "vault",
        },
      ]);
      break;
  }
}
