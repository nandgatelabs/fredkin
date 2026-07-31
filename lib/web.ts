import { Platform, type ViewStyle } from "react-native";

/** Cursor + hover affordance for interactive controls on web. */
export const webClickable: ViewStyle =
  Platform.OS === "web"
    ? {
        cursor: "pointer",
      }
    : {};

export const webFontBody =
  Platform.OS === "web" ? ("Source Sans 3, Segoe UI, sans-serif" as const) : undefined;

export const webFontDisplay =
  Platform.OS === "web" ? ("Fraunces, Georgia, serif" as const) : undefined;
