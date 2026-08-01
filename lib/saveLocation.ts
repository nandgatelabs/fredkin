/**
 * Default export/backup directory: a `money-money` folder.
 * Native: app documents (or user-picked SAF tree on Android).
 * Web: browser Downloads by default; optional directory handle via File System Access API.
 */
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

import { getSetting, setSetting } from "@/db/client";
import { log } from "@/lib/logger";

const FOLDER = "money-money";
const KEY_CUSTOM_URI = "saveDirUri";
const KEY_CUSTOM_LABEL = "saveDirLabel";

export type SaveLocationInfo = {
  /** User-facing path / description */
  label: string;
  /** True when using the built-in default (not a custom pick) */
  isDefault: boolean;
  /** Platform-specific URI when known (native file/SAF uri) */
  uri: string | null;
};

let webDirHandle: FileSystemDirectoryHandle | null = null;

function defaultNativeRoot(): string | null {
  const base = FileSystem.documentDirectory;
  if (!base) return null;
  return `${base}${FOLDER}/`;
}

export async function getDefaultSaveLocationLabel(): Promise<string> {
  if (Platform.OS === "web") {
    return "Browser Downloads (default)";
  }
  const root = defaultNativeRoot();
  return root ? `${root}` : `App documents / ${FOLDER}`;
}

export async function getSaveLocation(): Promise<SaveLocationInfo> {
  const customUri = (await getSetting(KEY_CUSTOM_URI))?.trim() || "";
  const customLabel = (await getSetting(KEY_CUSTOM_LABEL))?.trim() || "";

  if (Platform.OS === "web") {
    if (webDirHandle || customUri === "web-directory") {
      return {
        label: customLabel || webDirHandle?.name || FOLDER,
        isDefault: false,
        uri: null,
      };
    }
    return {
      label: await getDefaultSaveLocationLabel(),
      isDefault: true,
      uri: null,
    };
  }

  if (customUri) {
    return {
      label: customLabel || customUri,
      isDefault: false,
      uri: customUri,
    };
  }

  const root = defaultNativeRoot();
  return {
    label: root ?? `App documents / ${FOLDER}`,
    isDefault: true,
    uri: root,
  };
}

export async function ensureDefaultNativeDir(): Promise<string> {
  const root = defaultNativeRoot();
  if (!root) throw new Error("No app document directory available");
  const info = await FileSystem.getInfoAsync(root);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(root, { intermediates: true });
    log.info("Created default save folder", root);
  }
  return root;
}

export async function restoreDefaultSaveLocation(): Promise<SaveLocationInfo> {
  await setSetting(KEY_CUSTOM_URI, "");
  await setSetting(KEY_CUSTOM_LABEL, "");
  webDirHandle = null;
  log.info("Save location restored to default");
  return getSaveLocation();
}

export async function pickSaveLocation(): Promise<SaveLocationInfo> {
  if (Platform.OS === "web") {
    return pickWebDirectory();
  }
  if (Platform.OS === "android") {
    return pickAndroidDirectory();
  }
  // iOS: stick to app documents; document picker for dirs is limited
  throw new Error(
    "Custom folders are supported on Android and web. iOS uses the app Documents/money-money folder.",
  );
}

async function pickAndroidDirectory(): Promise<SaveLocationInfo> {
  const permissions =
    await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permissions.granted) {
    throw new Error("Folder permission not granted");
  }
  const uri = permissions.directoryUri;
  await setSetting(KEY_CUSTOM_URI, uri);
  await setSetting(KEY_CUSTOM_LABEL, uri);
  log.info("Save location changed (SAF)", uri);
  return getSaveLocation();
}

async function pickWebDirectory(): Promise<SaveLocationInfo> {
  const w = globalThis as typeof globalThis & {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  };
  if (typeof w.showDirectoryPicker !== "function") {
    throw new Error(
      "This browser cannot pick a save folder. Files download to the browser Downloads location.",
    );
  }
  const handle = await w.showDirectoryPicker();
  webDirHandle = handle;
  await setSetting(KEY_CUSTOM_URI, "web-directory");
  await setSetting(KEY_CUSTOM_LABEL, handle.name || FOLDER);
  log.info("Save location changed (web)", handle.name);
  return getSaveLocation();
}

/** Write text into the configured folder; returns where it went. */
export async function writeTextToSaveLocation(
  fileName: string,
  text: string,
  mime: string,
): Promise<{ label: string; uri: string | null }> {
  if (Platform.OS === "web") {
    if (webDirHandle) {
      const file = await webDirHandle.getFileHandle(fileName, { create: true });
      const writable = await file.createWritable();
      await writable.write(text);
      await writable.close();
      const loc = await getSaveLocation();
      log.info("Wrote file to web directory", fileName);
      return { label: `${loc.label}/${fileName}`, uri: null };
    }
    // Caller should fall back to browser download
    return { label: await getDefaultSaveLocationLabel(), uri: null };
  }

  const loc = await getSaveLocation();
  if (loc.uri && loc.uri.startsWith("content://")) {
    const mimeType = mime.includes("json")
      ? "application/json"
      : mime.includes("csv")
        ? "text/csv"
        : "text/plain";
    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      loc.uri,
      fileName,
      mimeType,
    );
    await FileSystem.writeAsStringAsync(fileUri, text, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    log.info("Wrote file via SAF", fileUri);
    return { label: `${loc.label} / ${fileName}`, uri: fileUri };
  }

  const dir = await ensureDefaultNativeDir();
  const fileUri = `${dir}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, text, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  log.info("Wrote file to default folder", fileUri);
  return { label: fileUri, uri: fileUri };
}

export async function hasWebDirectoryHandle(): Promise<boolean> {
  return webDirHandle != null;
}
