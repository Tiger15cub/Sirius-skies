import { PlaylistImages } from "../../api/discovery";
import { Result } from "../../interface";
import log from "../log";

export default function updatePlaylistImage(
  result: Result,
  playlistImages: PlaylistImages
): string | null {
  const { mnemonic, metadata } = result.linkData;
  const { image_url } = metadata;

  if (image_url !== playlistImages[mnemonic]) {
    metadata.image_url = playlistImages[mnemonic];
    return result.linkCode;
  } else {
    log.warn(`Playlist image for ${mnemonic} is already updated.`, "Discovery");
  }

  return null;
}
