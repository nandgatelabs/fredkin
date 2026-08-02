import { Platform, type ViewStyle } from "react-native";

/** Cursor + hover affordance for interactive controls on web. */
export const webClickable: ViewStyle =
  Platform.OS === "web"
    ? {
        cursor: "pointer",
      }
    : {};

/**
 * Props so Pressables join the Tab / Enter / Space keyboard path on web.
 * Spread onto Pressable alongside accessibilityRole="button".
 */
export const webFocusableProps: { focusable: true; tabIndex?: 0 } =
  Platform.OS === "web"
    ? { focusable: true, tabIndex: 0 }
    : { focusable: true };

export const webFontBody =
  Platform.OS === "web" ? ("Source Sans 3, Segoe UI, sans-serif" as const) : undefined;

export const webFontDisplay =
  Platform.OS === "web" ? ("Fraunces, Georgia, serif" as const) : undefined;

/** Native HTML tooltip on web (`title` attribute). No-op on native. */
export function webTitle(label: string): { title?: string } {
  return Platform.OS === "web" ? { title: label } : {};
}
