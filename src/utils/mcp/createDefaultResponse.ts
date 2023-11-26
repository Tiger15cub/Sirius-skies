export function createDefaultResponse(
  profileChanges: any,
  profileId: any,
  rvn: number
) {
  return {
    profileRevision: rvn ? rvn - 0 + (1 - 0) : 1,
    profileId,
    profileChangesBaseRevision: Number(rvn) || 1,
    profileChanges,
    profileCommandRevision: rvn ? rvn - 0 + (1 - 0) : 1,
    serverTime: new Date(),
    responseVersion: 1,
  };
}
