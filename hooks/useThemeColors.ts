import { useMemo } from "react";

import { useSettingsStore } from "@/store/settings";
import { resolvePalette, type ColorTokens } from "@/theme/palettes";

/** Live palette for the active theme — safe inside StyleSheet-heavy screens. */
export function useThemeColors(): ColorTokens {
  const themeId = useSettingsStore((s) => s.themeId);
  const uiMode = useSettingsStore((s) => s.uiMode);
  return useMemo(() => resolvePalette(themeId, uiMode), [themeId, uiMode]);
}
