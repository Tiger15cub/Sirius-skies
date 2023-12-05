import { SeasonInfo, UserAgentInfo } from "../interface";

export function getSeason(userAgent: string | undefined): SeasonInfo | null {
  try {
    if (!userAgent) return null;

    const getBuildID = (): string | undefined =>
      userAgent.split("-")[3]?.split(",")[0] ||
      userAgent.split("-")[1]?.split("+")[0];

    const parseBuildString = (buildString: string): number =>
      Math.floor(parseFloat(buildString)) || 0;

    const handleValidBuild = ({
      buildID,
      buildString,
    }: UserAgentInfo): SeasonInfo => {
      const netcl = !isNaN(Number(buildID)) ? buildID : undefined;
      const build = parseBuildString(buildString || "");
      const buildUpdate = userAgent.split("-")[1].split("+")[0];
      const season = build;
      let lobby: string = "";

      switch (true) {
        case season === 0:
          lobby = "LobbySeason0";
          break;
        case season <= 3790078:
          lobby = `LobbySeason${season}`;
          break;
        case Number.isInteger(season):
          lobby = "LobbyWinterDecor";
          break;
        default:
          lobby = "";
      }

      return { season, build, netcl, lobby, buildUpdate };
    };

    const { buildID, buildString } = {
      buildID: getBuildID(),
      buildString: userAgent.split("Release-")[1]?.split("-")[0] || "",
    };

    if (
      (buildID || buildString) &&
      !isNaN(parseFloat(buildID || buildString))
    ) {
      return handleValidBuild({ buildID, buildString });
    }

    throw new Error("Invalid user agent format");
  } catch (error) {
    console.error("Error parsing user agent:", error);
    return null;
  }
}
