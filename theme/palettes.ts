/**
 * Theme families (each has dark + light via UiMode).
 *
 * Slate / Teal / Copper — solid palettes.
 * WhatsApp — chat-green dark UI.
 * Glass Mist / Glass Rose — glassmorphism (cool vs pink).
 */
export type ColorTokens = {
  background: string;
  surface: string;
  surfaceElevated: string;
  /** Opaque panel for modals / sheets (readable over glass). */
  dialog: string;
  border: string;
  borderSubtle: string;
  accent: string;
  accentMuted: string;
  accentPressed: string;
  /** Soft wash for pressed / selected rows (theme-aware). */
  accentSoft: string;
  onAccent: string;
  text: string;
  textSecondary: string;
  expense: string;
  income: string;
  transfer: string;
  danger: string;
  dangerMuted: string;
  tabInactive: string;
  fab: string;
  overlay: string;
  focusRing: string;
  inputBg: string;
};

export type ThemeId =
  | "slate"
  | "teal"
  | "copper"
  | "whatsapp"
  | "glassMist"
  | "glassRose";

export type UiMode = "dark" | "light";

export const THEME_OPTIONS: { id: ThemeId; label: string }[] = [
  { id: "slate", label: "Slate" },
  { id: "teal", label: "Teal" },
  { id: "copper", label: "Copper" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "glassMist", label: "Glass Mist" },
  { id: "glassRose", label: "Glass Rose" },
];

export const UI_MODE_OPTIONS: { id: UiMode; label: string }[] = [
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
];

const CURRENT = new Set<string>([
  "slate",
  "teal",
  "copper",
  "whatsapp",
  "glassMist",
  "glassRose",
]);

/** Map retired ids + unknown values onto the current set. */
export function normalizeThemeId(raw: unknown): ThemeId {
  if (typeof raw === "string" && CURRENT.has(raw)) return raw as ThemeId;
  if (raw === "glass") return "glassMist";
  if (raw === "original" || raw === "midnight") return "slate";
  if (raw === "forest") return "teal";
  return "slate";
}

export function isGlassTheme(themeId: ThemeId | string | null | undefined): boolean {
  const id = normalizeThemeId(themeId);
  return id === "glassMist" || id === "glassRose";
}

const slateDark: ColorTokens = {
  background: "#0A0E14",
  surface: "#121820",
  surfaceElevated: "#1A222E",
  dialog: "#1A222E",
  border: "#2A3545",
  borderSubtle: "#1E2836",
  accent: "#5B9DFF",
  accentMuted: "#7A8BA3",
  accentPressed: "#3D7FE0",
  accentSoft: "rgba(91, 157, 255, 0.14)",
  onAccent: "#0A0E14",
  text: "#E8EDF5",
  textSecondary: "#9AA8BC",
  expense: "#FF6B5C",
  income: "#3DDC97",
  transfer: "#5BB8F5",
  danger: "#FF5C6A",
  dangerMuted: "rgba(255, 92, 106, 0.16)",
  tabInactive: "#6B7A90",
  fab: "#1A222E",
  overlay: "rgba(4, 8, 14, 0.72)",
  focusRing: "rgba(91, 157, 255, 0.5)",
  inputBg: "#080B10",
};

const slateLight: ColorTokens = {
  background: "#F2F5F9",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  dialog: "#FFFFFF",
  border: "#C5D0DE",
  borderSubtle: "#E2E8F0",
  accent: "#1C6CFF",
  accentMuted: "#5C6F8A",
  accentPressed: "#1554D4",
  accentSoft: "rgba(28, 108, 255, 0.1)",
  onAccent: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#475569",
  expense: "#E11D48",
  income: "#059669",
  transfer: "#0284C7",
  danger: "#DC2626",
  dangerMuted: "rgba(220, 38, 38, 0.12)",
  tabInactive: "#64748B",
  fab: "#1C6CFF",
  overlay: "rgba(15, 23, 42, 0.4)",
  focusRing: "rgba(28, 108, 255, 0.45)",
  inputBg: "#FFFFFF",
};

const tealDark: ColorTokens = {
  background: "#0B1211",
  surface: "#121C1A",
  surfaceElevated: "#1A2825",
  dialog: "#1A2825",
  border: "#2A3F3B",
  borderSubtle: "#1E302C",
  accent: "#2DD4BF",
  accentMuted: "#7A9E97",
  accentPressed: "#14B8A6",
  accentSoft: "rgba(45, 212, 191, 0.14)",
  onAccent: "#0B1211",
  text: "#E7F5F2",
  textSecondary: "#9BB5AF",
  expense: "#FB7185",
  income: "#4ADE80",
  transfer: "#38BDF8",
  danger: "#F87171",
  dangerMuted: "rgba(248, 113, 113, 0.16)",
  tabInactive: "#6B8A84",
  fab: "#1A2825",
  overlay: "rgba(4, 10, 9, 0.72)",
  focusRing: "rgba(45, 212, 191, 0.5)",
  inputBg: "#080E0D",
};

const tealLight: ColorTokens = {
  background: "#F0FDFA",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  dialog: "#FFFFFF",
  border: "#99D6CC",
  borderSubtle: "#CCFBF1",
  accent: "#0D9488",
  accentMuted: "#5C7A74",
  accentPressed: "#0F766E",
  accentSoft: "rgba(13, 148, 136, 0.1)",
  onAccent: "#FFFFFF",
  text: "#134E4A",
  textSecondary: "#3F6661",
  expense: "#E11D48",
  income: "#15803D",
  transfer: "#0369A1",
  danger: "#DC2626",
  dangerMuted: "rgba(220, 38, 38, 0.12)",
  tabInactive: "#5C7A74",
  fab: "#0D9488",
  overlay: "rgba(19, 78, 74, 0.4)",
  focusRing: "rgba(13, 148, 136, 0.45)",
  inputBg: "#FFFFFF",
};

const copperDark: ColorTokens = {
  background: "#12100E",
  surface: "#1C1916",
  surfaceElevated: "#27221E",
  dialog: "#27221E",
  border: "#3D342C",
  borderSubtle: "#2A241F",
  accent: "#E0A06A",
  accentMuted: "#A08A74",
  accentPressed: "#C8864A",
  accentSoft: "rgba(224, 160, 106, 0.14)",
  onAccent: "#12100E",
  text: "#F3EDE6",
  textSecondary: "#B0A094",
  expense: "#F07167",
  income: "#7BC47F",
  transfer: "#7EB6D9",
  danger: "#E86A6A",
  dangerMuted: "rgba(232, 106, 106, 0.16)",
  tabInactive: "#7A6E62",
  fab: "#27221E",
  overlay: "rgba(8, 6, 4, 0.72)",
  focusRing: "rgba(224, 160, 106, 0.5)",
  inputBg: "#0E0C0A",
};

const copperLight: ColorTokens = {
  background: "#F7F2EC",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFBF7",
  dialog: "#FFFBF7",
  border: "#D4C4B4",
  borderSubtle: "#EBE0D4",
  accent: "#B86B2E",
  accentMuted: "#8A7A68",
  accentPressed: "#945520",
  accentSoft: "rgba(184, 107, 46, 0.1)",
  onAccent: "#FFFFFF",
  text: "#1C1612",
  textSecondary: "#5C4E42",
  expense: "#C2410C",
  income: "#15803D",
  transfer: "#0369A1",
  danger: "#B91C1C",
  dangerMuted: "rgba(185, 28, 28, 0.12)",
  tabInactive: "#8A7A68",
  fab: "#B86B2E",
  overlay: "rgba(28, 22, 18, 0.4)",
  focusRing: "rgba(184, 107, 46, 0.45)",
  inputBg: "#FFFFFF",
};

/** WhatsApp-like teal-green chat UI. */
const whatsappDark: ColorTokens = {
  background: "#0B141A",
  surface: "#1F2C34",
  surfaceElevated: "#2A3942",
  dialog: "#2A3942",
  border: "#3B4A54",
  borderSubtle: "#233138",
  accent: "#25D366",
  accentMuted: "#8696A0",
  accentPressed: "#1DA851",
  accentSoft: "rgba(37, 211, 102, 0.16)",
  onAccent: "#0B141A",
  text: "#E9EDEF",
  textSecondary: "#8696A0",
  expense: "#F15C6D",
  income: "#25D366",
  transfer: "#53BDEB",
  danger: "#EA0038",
  dangerMuted: "rgba(234, 0, 56, 0.16)",
  tabInactive: "#667781",
  fab: "#25D366",
  overlay: "rgba(11, 20, 26, 0.72)",
  focusRing: "rgba(37, 211, 102, 0.5)",
  inputBg: "#2A3942",
};

const whatsappLight: ColorTokens = {
  background: "#EFEAE2",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  dialog: "#FFFFFF",
  border: "#D1D7DB",
  borderSubtle: "#E9EDEF",
  accent: "#128C7E",
  accentMuted: "#667781",
  accentPressed: "#0E6F64",
  accentSoft: "rgba(18, 140, 126, 0.12)",
  onAccent: "#FFFFFF",
  text: "#111B21",
  textSecondary: "#667781",
  expense: "#E11D48",
  income: "#128C7E",
  transfer: "#027EB5",
  danger: "#EA0038",
  dangerMuted: "rgba(234, 0, 56, 0.12)",
  tabInactive: "#8696A0",
  fab: "#25D366",
  overlay: "rgba(17, 27, 33, 0.4)",
  focusRing: "rgba(18, 140, 126, 0.45)",
  inputBg: "#FFFFFF",
};

/** Cool blue glass (formerly “Glass”). */
const glassMistDark: ColorTokens = {
  background: "#070B12",
  surface: "rgba(255, 255, 255, 0.08)",
  surfaceElevated: "rgba(14, 20, 32, 0.97)",
  dialog: "#0E1420",
  border: "rgba(255, 255, 255, 0.22)",
  borderSubtle: "rgba(255, 255, 255, 0.1)",
  accent: "#8EC5FF",
  accentMuted: "#A8B8CC",
  accentPressed: "#6AAEF5",
  accentSoft: "rgba(142, 197, 255, 0.18)",
  onAccent: "#070B12",
  text: "#F4F7FC",
  textSecondary: "#B7C4D6",
  expense: "#FF8A7A",
  income: "#5EE9A8",
  transfer: "#7DD3FC",
  danger: "#FF7A88",
  dangerMuted: "rgba(255, 122, 136, 0.18)",
  tabInactive: "#8A9BB0",
  fab: "rgba(255, 255, 255, 0.14)",
  overlay: "rgba(4, 8, 14, 0.78)",
  focusRing: "rgba(142, 197, 255, 0.55)",
  inputBg: "rgba(14, 20, 32, 0.92)",
};

const glassMistLight: ColorTokens = {
  background: "#E8EEF6",
  surface: "rgba(255, 255, 255, 0.55)",
  surfaceElevated: "rgba(244, 247, 252, 0.97)",
  dialog: "#F4F7FC",
  border: "rgba(255, 255, 255, 0.75)",
  borderSubtle: "rgba(148, 163, 184, 0.35)",
  accent: "#2563EB",
  accentMuted: "#64748B",
  accentPressed: "#1D4ED8",
  accentSoft: "rgba(37, 99, 235, 0.12)",
  onAccent: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#475569",
  expense: "#E11D48",
  income: "#059669",
  transfer: "#0284C7",
  danger: "#DC2626",
  dangerMuted: "rgba(220, 38, 38, 0.12)",
  tabInactive: "#64748B",
  fab: "rgba(255, 255, 255, 0.7)",
  overlay: "rgba(15, 23, 42, 0.5)",
  focusRing: "rgba(37, 99, 235, 0.45)",
  inputBg: "#FFFFFF",
};

/** Pink / rose glass. */
const glassRoseDark: ColorTokens = {
  background: "#140A12",
  surface: "rgba(255, 200, 220, 0.08)",
  surfaceElevated: "rgba(28, 14, 24, 0.97)",
  dialog: "#1C0E18",
  border: "rgba(255, 182, 210, 0.28)",
  borderSubtle: "rgba(255, 182, 210, 0.12)",
  accent: "#F9A8D4",
  accentMuted: "#C4A0B4",
  accentPressed: "#F472B6",
  accentSoft: "rgba(249, 168, 212, 0.2)",
  onAccent: "#140A12",
  text: "#FFF1F6",
  textSecondary: "#D8B4C8",
  expense: "#FB7185",
  income: "#6EE7B7",
  transfer: "#C4B5FD",
  danger: "#FB7185",
  dangerMuted: "rgba(251, 113, 133, 0.18)",
  tabInactive: "#A88A9C",
  fab: "rgba(249, 168, 212, 0.22)",
  overlay: "rgba(20, 10, 18, 0.78)",
  focusRing: "rgba(249, 168, 212, 0.55)",
  inputBg: "rgba(28, 14, 24, 0.92)",
};

const glassRoseLight: ColorTokens = {
  background: "#FDF2F8",
  surface: "rgba(255, 255, 255, 0.62)",
  surfaceElevated: "rgba(255, 245, 249, 0.97)",
  dialog: "#FFF5F9",
  border: "rgba(251, 207, 232, 0.9)",
  borderSubtle: "rgba(244, 114, 182, 0.2)",
  accent: "#DB2777",
  accentMuted: "#9D174D",
  accentPressed: "#BE185D",
  accentSoft: "rgba(219, 39, 119, 0.12)",
  onAccent: "#FFFFFF",
  text: "#500724",
  textSecondary: "#9D174D",
  expense: "#E11D48",
  income: "#059669",
  transfer: "#7C3AED",
  danger: "#E11D48",
  dangerMuted: "rgba(225, 29, 72, 0.12)",
  tabInactive: "#9D174D",
  fab: "rgba(255, 255, 255, 0.75)",
  overlay: "rgba(80, 7, 36, 0.5)",
  focusRing: "rgba(219, 39, 119, 0.45)",
  inputBg: "#FFFFFF",
};

const TABLE: Record<ThemeId, Record<UiMode, ColorTokens>> = {
  slate: { dark: slateDark, light: slateLight },
  teal: { dark: tealDark, light: tealLight },
  copper: { dark: copperDark, light: copperLight },
  whatsapp: { dark: whatsappDark, light: whatsappLight },
  glassMist: { dark: glassMistDark, light: glassMistLight },
  glassRose: { dark: glassRoseDark, light: glassRoseLight },
};

export function resolvePalette(themeId: ThemeId, uiMode: UiMode): ColorTokens {
  return TABLE[normalizeThemeId(themeId)]?.[uiMode] ?? slateDark;
}
