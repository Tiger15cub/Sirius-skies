export function parseMessageContent(content: string | undefined): string[] {
  return Buffer.from(content as string, "base64")
    .toString()
    .split("\u0000");
}
