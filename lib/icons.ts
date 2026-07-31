import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

type IconName = ComponentProps<typeof Ionicons>["name"];

/** Account icon keys shown in add/edit picker (order matches design). */
export const ACCOUNT_ICON_OPTIONS = [
  "cash",
  "card",
  "piggy",
  "mastercard",
  "visa",
] as const;

export type AccountIconKey = (typeof ACCOUNT_ICON_OPTIONS)[number];

const ACCOUNT_ICONS: Record<string, IconName> = {
  cash: "cash-outline",
  card: "card-outline",
  piggy: "happy-outline",
  mastercard: "ellipse-outline",
  visa: "card",
  wallet: "wallet-outline",
  business: "business-outline",
};

/** Category icon keys for picker grid. */
export const CATEGORY_ICON_OPTIONS = [
  { key: "car", color: "#7E57C2" },
  { key: "shirt", color: "#FB8C00" },
  { key: "restaurant", color: "#E53935" },
  { key: "home", color: "#D81B60" },
  { key: "cart", color: "#3949AB" },
  { key: "medkit", color: "#00897B" },
  { key: "film", color: "#8E24AA" },
  { key: "heart", color: "#F4511E" },
  { key: "shield", color: "#5C6BC0" },
  { key: "tennisball", color: "#43A047" },
  { key: "bus", color: "#1E88E5" },
  { key: "pricetag", color: "#E53935" },
  { key: "school", color: "#1565C0" },
  { key: "gift", color: "#00897B" },
  { key: "trophy", color: "#1E88E5" },
  { key: "wallet", color: "#EC407A" },
  { key: "refresh", color: "#43A047" },
  { key: "cash", color: "#6A1B9A" },
  { key: "people", color: "#43A047" },
  { key: "phone-portrait", color: "#C0CA33" },
] as const;

const CATEGORY_ICONS: Record<string, IconName> = {
  car: "car-outline",
  shirt: "shirt-outline",
  restaurant: "restaurant-outline",
  home: "home-outline",
  cart: "cart-outline",
  medkit: "medkit-outline",
  film: "film-outline",
  heart: "heart-outline",
  shield: "shield-outline",
  tennisball: "tennisball-outline",
  bus: "bus-outline",
  pricetag: "pricetag-outline",
  school: "school-outline",
  gift: "gift-outline",
  trophy: "trophy-outline",
  wallet: "wallet-outline",
  refresh: "refresh-outline",
  cash: "cash-outline",
  people: "people-outline",
  "phone-portrait": "phone-portrait-outline",
  document: "document-text-outline",
};

export function accountIcon(iconKey: string): IconName {
  return ACCOUNT_ICONS[iconKey] ?? "wallet-outline";
}

export function categoryIcon(iconKey: string): IconName {
  return CATEGORY_ICONS[iconKey] ?? "pricetag-outline";
}

export function categoryColor(iconKey: string, fallback = "#E88F78"): string {
  const found = CATEGORY_ICON_OPTIONS.find((i) => i.key === iconKey);
  return found?.color ?? fallback;
}
