export type ColorTokens = {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderSubtle: string;
  accent: string;
  accentMuted: string;
  accentPressed: string;
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

export type ThemeId = "original" | "midnight" | "forest";
export type UiMode = "dark" | "light";

export const THEME_OPTIONS: { id: ThemeId; label: string }[] = [
  { id: "original", label: "Original" },
  { id: "midnight", label: "Midnight" },
  { id: "forest", label: "Forest" },
];

export const UI_MODE_OPTIONS: { id: UiMode; label: string }[] = [
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
];

const originalDark: ColorTokens = {
  background: "#24231F",
  surface: "#2F2E29",
  surfaceElevated: "#3A3831",
  border: "#5C5748",
  borderSubtle: "#3F3D34",
  accent: "#E8D48A",
  accentMuted: "#B0A88E",
  accentPressed: "#C9B56E",
  onAccent: "#1F1E1A",
  text: "#F5EDD6",
  textSecondary: "#B0A88E",
  expense: "#E89A84",
  income: "#8FCF92",
  transfer: "#74BBEF",
  danger: "#E87B7B",
  dangerMuted: "rgba(232, 123, 123, 0.16)",
  tabInactive: "#7A7463",
  fab: "#3A3831",
  overlay: "rgba(10, 9, 7, 0.72)",
  focusRing: "rgba(232, 212, 138, 0.45)",
  inputBg: "#1C1B18",
};

const originalLight: ColorTokens = {
  background: "#F4F1E8",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFCF5",
  border: "#C9C2B0",
  borderSubtle: "#E5DFD0",
  accent: "#8A7340",
  accentMuted: "#8A8270",
  accentPressed: "#6E5A2E",
  onAccent: "#FFFFFF",
  text: "#24231F",
  textSecondary: "#5C5748",
  expense: "#C45C45",
  income: "#2F8F4E",
  transfer: "#2A7EB5",
  danger: "#C43C3C",
  dangerMuted: "rgba(196, 60, 60, 0.12)",
  tabInactive: "#8A8270",
  fab: "#8A7340",
  overlay: "rgba(30, 28, 24, 0.45)",
  focusRing: "rgba(138, 115, 64, 0.45)",
  inputBg: "#FFFFFF",
};

const midnightDark: ColorTokens = {
  ...originalDark,
  background: "#12141C",
  surface: "#1A1D29",
  surfaceElevated: "#242836",
  border: "#3A4158",
  borderSubtle: "#2A3044",
  accent: "#A8C0FF",
  accentMuted: "#7A88A8",
  accentPressed: "#8099E0",
  onAccent: "#12141C",
  text: "#E8ECF8",
  textSecondary: "#9AA3BC",
  tabInactive: "#6B738C",
  fab: "#242836",
  inputBg: "#0E1016",
  focusRing: "rgba(168, 192, 255, 0.45)",
};

const midnightLight: ColorTokens = {
  ...originalLight,
  background: "#EEF1F8",
  accent: "#3D5A9E",
  accentMuted: "#6B738C",
  accentPressed: "#2E457A",
  border: "#B8C0D4",
  textSecondary: "#4A5168",
};

const forestDark: ColorTokens = {
  ...originalDark,
  background: "#1A221C",
  surface: "#243028",
  surfaceElevated: "#2E3C32",
  border: "#4A5C4E",
  borderSubtle: "#344038",
  accent: "#B8D4A8",
  accentMuted: "#8AA07A",
  accentPressed: "#9ABA88",
  onAccent: "#1A221C",
  text: "#EAF2E6",
  textSecondary: "#A0B098",
  tabInactive: "#6E8070",
  fab: "#2E3C32",
  inputBg: "#141A16",
  focusRing: "rgba(184, 212, 168, 0.45)",
};

const forestLight: ColorTokens = {
  ...originalLight,
  background: "#EEF4EA",
  accent: "#3F6B3A",
  accentMuted: "#6E8070",
  accentPressed: "#2F522C",
  border: "#B5C4B0",
  textSecondary: "#455245",
};

const TABLE: Record<ThemeId, Record<UiMode, ColorTokens>> = {
  original: { dark: originalDark, light: originalLight },
  midnight: { dark: midnightDark, light: midnightLight },
  forest: { dark: forestDark, light: forestLight },
};

export function resolvePalette(themeId: ThemeId, uiMode: UiMode): ColorTokens {
  return TABLE[themeId]?.[uiMode] ?? originalDark;
}
