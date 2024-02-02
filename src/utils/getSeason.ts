import { SeasonInfo, UserAgentInfo } from "../interface";
import log from "./log";

export function getSeason(userAgent: string | undefined): SeasonInfo | null {
  if (!userAgent) {
    log.error("User agent is undefined", "getSeason");
    return null;
  }

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
    let build = parseBuildString(buildString || "");
    const buildUpdate = userAgent.split("-")[1].split("+")[0];
    let season = build;
    let lobby: string = "";

    switch (true) {
      case Number.isNaN(netcl):
        lobby = "LobbySeason0";
        season = 0;
        build = 0.0;
        break;

      case Number(netcl) < 3724489:
        lobby = "Season0";
        season = 0;
        build = 0.0;
        break;

      case Number(netcl) <= 3790078:
        lobby = "LobbySeason1";
        season = 1;
        build = 1.0;
        break;

      default:
        season = 2;
        build = 2.0;
        lobby = "LobbyWinterDecor";
        break;
    }

    return { season, build, netcl, lobby, buildUpdate };
  };

  const buildID = getBuildID();
  const buildString = userAgent.split("Release-")[1]?.split("-")[0] || "";

  if ((buildID || buildString) && !isNaN(parseFloat(buildID || buildString))) {
    return handleValidBuild({ buildID, buildString });
  } else {
    log.error("Invalid build ID or build string", "getSeason");
    return null;
  }
}
