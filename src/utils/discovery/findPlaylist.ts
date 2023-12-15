import { Discovery, LinkData, Result } from "../../interface";

export async function findPlaylist(
  discovery: Discovery,
  condition: (result: Result) => boolean
): Promise<LinkData | null> {
  for (const panel of discovery.Panels) {
    for (const page of panel.Pages) {
      for (const result of page.results) {
        if (condition(result)) {
          return result.linkData;
        }
      }
    }
  }
  return null;
}
