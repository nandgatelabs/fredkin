import { Platform, Share } from "react-native";

export class SaveCancelledError extends Error {
  constructor() {
    super("cancelled");
    this.name = "SaveCancelledError";
  }
}

type SavePickerHandle = {
  createWritable: () => Promise<{
    write: (data: string | Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
};

type SavePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName?: string;
    types?: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<SavePickerHandle>;
};

function mimeAccept(mime: string, fileName: string): Record<string, string[]> {
  const ext = fileName.includes(".")
    ? `.${fileName.split(".").pop()!.toLowerCase()}`
    : "";
  if (mime.includes("json") || fileName.endsWith(".mbak")) {
    return {
      "application/json": [".json", ".mbak"],
      "application/octet-stream": [".mbak"],
    };
  }
  if (mime.includes("csv") || ext === ".csv") {
    return { "text/csv": [".csv"], "text/plain": [".csv", ".txt"] };
  }
  return { [mime]: ext ? [ext] : [] };
}

/**
 * Let the user choose where to save a text file.
 * Web: File System Access API when available, else browser download.
 * Native: system Share sheet (user picks destination / app).
 */
export async function saveTextFile(
  fileName: string,
  text: string,
  mime = "text/csv",
): Promise<{ method: "picker" | "download" | "share" }> {
  if (Platform.OS === "web") {
    const w = window as SavePickerWindow;
    if (typeof w.showSaveFilePicker === "function") {
      try {
        const handle = await w.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: fileName.endsWith(".mbak")
                ? "money-money backup"
                : mime.includes("csv")
                  ? "CSV spreadsheet"
                  : "File",
              accept: mimeAccept(mime, fileName),
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(new Blob([text], { type: `${mime};charset=utf-8` }));
        await writable.close();
        return { method: "picker" };
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          throw new SaveCancelledError();
        }
        // Fall through to download if picker unsupported mid-flight.
      }
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
    return { method: "download" };
  }

  await Share.share({
    title: fileName,
    message: text,
  });
  return { method: "share" };
}

/** @deprecated Prefer saveTextFile — kept for any callers expecting auto-download. */
export async function downloadTextFile(
  fileName: string,
  text: string,
  mime = "text/csv",
) {
  await saveTextFile(fileName, text, mime);
}
