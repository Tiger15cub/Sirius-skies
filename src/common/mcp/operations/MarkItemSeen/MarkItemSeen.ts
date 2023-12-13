import { createDefaultResponse, getSeason } from "../../../../utils";

export default async function MarkItemSeen(
  profileId: string,
  rvn: number,
  req: any
) {
  const userAgent = req.headers["user-agent"];
  let season = getSeason(userAgent);

  return createDefaultResponse([], profileId, rvn + 1);
}
