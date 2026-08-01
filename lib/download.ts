import { Platform, Share } from "react-native";
import * as Sharing from "expo-sharing";

import { log } from "@/lib/logger";
import {
  hasWebDirectoryHandle,
  writeTextToSaveLocation,
} from "@/lib/saveLocation";

export type DownloadResult = {
  /** Where the file landed (path or description) */
  locationLabel: string;
};

/**
 * Save a text file into the configured money-money folder when possible,
 * then offer the system share sheet on native so the user can copy elsewhere.
 */
export async function downloadTextFile(
  fileName: string,
  text: string,
  mime = "text/csv",
): Promise<DownloadResult> {
  log.info("downloadTextFile", { fileName, mime, bytes: text.length });

  if (Platform.OS === "web") {
    if (await hasWebDirectoryHandle()) {
      const written = await writeTextToSaveLocation(fileName, text, mime);
      return { locationLabel: written.label };
    }
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    log.info("Browser download triggered", fileName);
    return { locationLabel: `Browser Downloads / ${fileName}` };
  }

  const written = await writeTextToSaveLocation(fileName, text, mime);
  if (written.uri && (await Sharing.isAvailableAsync())) {
    try {
      await Sharing.shareAsync(written.uri, {
        mimeType: mime,
        dialogTitle: fileName,
        UTI: mime.includes("json") ? "public.json" : "public.comma-separated-values-text",
      });
      log.info("Share sheet presented", written.uri);
    } catch (e) {
      log.warn("Share sheet dismissed or failed", e);
      // File is still on disk — that counts as saved.
    }
  } else if (!written.uri) {
    // Fallback: text share (should be rare)
    await Share.share({ title: fileName, message: text });
  }

  return { locationLabel: written.label };
}
