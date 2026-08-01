import { useSettingsStore } from "@/store/settings";

/** Allowed money display precision (0–4). */
export function clampDecimalPlaces(n: number): number {
  if (!Number.isFinite(n)) return 2;
  return Math.max(0, Math.min(4, Math.trunc(n)));
}

export function formatMoney(
  amount: number,
  options?: {
    sign?: "auto" | "always" | "never";
    currencySign?: string;
    currencyPosition?: "start" | "end";
    decimalPlaces?: number;
  },
) {
  const settings = useSettingsStore.getState();
  const currencySign = options?.currencySign ?? settings.currencySign;
  const currencyPosition = options?.currencyPosition ?? settings.currencyPosition;
  const decimalPlaces = clampDecimalPlaces(
    options?.decimalPlaces ?? settings.decimalPlaces,
  );
  const signMode = options?.sign ?? "auto";

  const abs = Math.abs(amount).toFixed(decimalPlaces);
  // Group only the integer side — never the fractional digits.
  const [intPart, fracPart] = abs.split(".");
  const groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const withGrouping =
    fracPart !== undefined ? `${groupedInt}.${fracPart}` : groupedInt;

  let signPrefix = "";
  if (signMode === "always" || (signMode === "auto" && amount < 0)) {
    signPrefix = "-";
  } else if (signMode === "auto" && amount > 0) {
    signPrefix = "";
  }

  const body =
    currencyPosition === "start"
      ? `${currencySign}${withGrouping}`
      : `${withGrouping}${currencySign}`;

  return `${signPrefix}${body}`;
}
