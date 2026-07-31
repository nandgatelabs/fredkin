import { Platform, Share } from "react-native";

/**
 * Save a text file.
 * Web: browser download to the default Downloads folder.
 * Native: system Share sheet (user picks destination / app).
 *
 * TODO: optional folder/file picker on web — tracked in GitHub
 * (File System Access API / showSaveFilePicker). Parked: Expo web
 * currently falls through to Downloads without a chooser.
 */
export async function downloadTextFile(
  fileName: string,
  text: string,
  mime = "text/csv",
): Promise<void> {
  if (Platform.OS === "web") {
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
    return;
  }

  await Share.share({
    title: fileName,
    message: text,
  });
}
