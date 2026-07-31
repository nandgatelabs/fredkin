/** Distinct colors for analysis charts and newly imported categories. */
export const ANALYSIS_PALETTE = [
  "#E07A62",
  "#E8C84A",
  "#7E9CFF",
  "#6BBF7A",
  "#D48BE8",
  "#5BB8B0",
  "#F0A060",
  "#74BBEF",
  "#E89AB8",
  "#A8D05F",
  "#C97B63",
  "#9B7BB8",
  "#4DB6AC",
  "#FFB74D",
  "#81C784",
  "#64B5F6",
  "#BA68C8",
  "#FF8A65",
  "#AED581",
  "#4FC3F7",
] as const;

export function analysisColor(index: number): string {
  return ANALYSIS_PALETTE[index % ANALYSIS_PALETTE.length];
}
