import { Platform } from "react-native";

import { log } from "@/lib/logger";

/** Web centered dialogs: +10% / +60% vs the previous 50%×50% size. */
export const WEB_DIALOG_WIDTH_FRAC = 0.55;
export const WEB_DIALOG_HEIGHT_FRAC = 0.8;

export const webDialogBackLabel = "← BACK";
export const webDialogCloseLabel = "✕ CLOSE";

const DIALOG_PATHS = [
  "/more",
  "/preferences",
  "/data",
  "/help",
  "/reset",
  "/export-csv",
  "/import-csv",
  "/backup",
  "/about-doc",
] as const;

export function isWebDialogPath(pathname: string): boolean {
  const path = pathname.split("?")[0] || "";
  return DIALOG_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

type DialogRouter = {
  back: () => void;
  dismiss?: (count?: number) => void;
  canDismiss?: () => boolean;
  navigate: (href: "/") => void;
  dismissAll?: () => void;
  dismissTo?: (href: "/") => void;
};

/**
 * Pop one dialog level (Settings → More, Export → Data).
 * Prefer dismiss() for transparentModal stacks; never jump to home.
 */
export function dismissWebDialog(router: DialogRouter): void {
  log.debug("dialog back");
  if (typeof router.canDismiss === "function" && router.canDismiss()) {
    router.dismiss?.(1);
    return;
  }
  if (typeof router.dismiss === "function") {
    router.dismiss(1);
    return;
  }
  router.back();
}

/** Close the whole dialog stack and return to the shell. */
export function closeWebDialog(router: DialogRouter): void {
  log.debug("dialog close");
  if (Platform.OS !== "web") {
    router.back();
    return;
  }
  if (typeof router.dismissTo === "function") {
    router.dismissTo("/");
    return;
  }
  if (typeof router.dismissAll === "function") {
    router.dismissAll();
  }
  router.navigate("/");
}
