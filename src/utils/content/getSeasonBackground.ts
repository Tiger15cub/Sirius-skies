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

    default:
      const doIndex = buildUpdate?.toString().indexOf(".");

      backgrounds.push([
        {
          stage: `season${buildUpdate?.toString().substring(0, doIndex)}`,
          _type: "DynamicBackground",
          key: "lobby",
        },
        {
          stage: `season${buildUpdate?.toString().substring(0, doIndex)}`,
          _type: "DynamicBackground",
          key: "vault",
        },
      ]);
  }
}
