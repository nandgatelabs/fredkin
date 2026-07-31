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
    abort?: () => Promise<void>;
  }>;
};

type SavePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName?: string;
    types?: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<SavePickerHandle>;
};

function mimeAccept(mime: string, fileName: string): Record<string, string[]> {
  if (mime.includes("json") || fileName.endsWith(".mbak")) {
    return {
      "application/json": [".json", ".mbak"],
      "application/octet-stream": [".mbak"],
    };
  }
  if (mime.includes("csv") || fileName.endsWith(".csv")) {
    return { "text/csv": [".csv"], "text/plain": [".csv", ".txt"] };
  }
  const ext = fileName.includes(".")
    ? `.${fileName.split(".").pop()!.toLowerCase()}`
    : "";
  return { [mime]: ext ? [ext] : [] };
}

function pickerDescription(fileName: string, mime: string) {
  if (fileName.endsWith(".mbak")) return "money-money backup";
  if (mime.includes("csv")) return "CSV spreadsheet";
  return "File";
}

function triggerBlobDownload(fileName: string, text: string, mime: string) {
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
}

/**
 * Open the save-location dialog first (while still in the click gesture),
 * then run `produce` and write the result. Chromium requires the picker to
 * open synchronously from a user activation — awaiting DB work first breaks it.
 */
export async function saveProducedTextFile(
  fileName: string,
  mime: string,
  produce: () => Promise<string>,
): Promise<{ method: "picker" | "download" | "share"; fileName: string }> {
  if (Platform.OS === "web") {
    const w = window as SavePickerWindow;
    if (typeof w.showSaveFilePicker === "function") {
      let handle: SavePickerHandle;
      try {
        handle = await w.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: pickerDescription(fileName, mime),
              accept: mimeAccept(mime, fileName),
            },
          ],
        });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          throw new SaveCancelledError();
        }
        // Picker unavailable / blocked — fall back after producing content.
        const text = await produce();
        triggerBlobDownload(fileName, text, mime);
        return { method: "download", fileName };
      }

      const text = await produce();
      const writable = await handle.createWritable();
      try {
        await writable.write(new Blob([text], { type: `${mime};charset=utf-8` }));
        await writable.close();
      } catch (e) {
        await writable.abort?.().catch(() => undefined);
        throw e instanceof Error ? e : new Error("Could not write file");
      }
      return { method: "picker", fileName };
    }

    const text = await produce();
    triggerBlobDownload(fileName, text, mime);
    return { method: "download", fileName };
  }

  const text = await produce();
  await Share.share({
    title: fileName,
    message: text,
  });
  return { method: "share", fileName };
}

/** Convenience when content is already ready (still opens picker first when possible). */
export async function saveTextFile(
  fileName: string,
  text: string,
  mime = "text/csv",
) {
  return saveProducedTextFile(fileName, mime, async () => text);
}
