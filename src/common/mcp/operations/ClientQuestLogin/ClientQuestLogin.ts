import { createDefaultResponse, getSeason } from "../../../../utils";

export default async function ClientQuestLogin(
  profileId: string,
  rvn: number,
  req: any
) {
  const userAgent = req.headers["user-agent"];
  let season = getSeason(userAgent);

  return createDefaultResponse([], profileId, rvn + 1);
}
