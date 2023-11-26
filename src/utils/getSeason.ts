export function getSeason(userAgent: string | undefined): string | number {
  return userAgent?.split("-")[1]?.split(".")[0] || 2;
}
