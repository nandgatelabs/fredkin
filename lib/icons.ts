import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

type IconName = ComponentProps<typeof Ionicons>["name"];

const ACCOUNT_ICONS: Record<string, IconName> = {
  cash: "cash-outline",
  card: "card-outline",
  wallet: "wallet-outline",
  business: "business-outline",
};

const CATEGORY_ICONS: Record<string, IconName> = {
  restaurant: "restaurant-outline",
  bus: "bus-outline",
  document: "document-text-outline",
  cart: "cart-outline",
  heart: "heart-outline",
  home: "home-outline",
  film: "film-outline",
  school: "school-outline",
  people: "people-outline",
  tennisball: "tennisball-outline",
  "phone-portrait": "phone-portrait-outline",
  shirt: "shirt-outline",
  cash: "cash-outline",
  wallet: "wallet-outline",
  trophy: "trophy-outline",
  refresh: "refresh-outline",
  pricetag: "pricetag-outline",
  gift: "gift-outline",
};

export function accountIcon(iconKey: string): IconName {
  return ACCOUNT_ICONS[iconKey] ?? "wallet-outline";
}

export function categoryIcon(iconKey: string): IconName {
  return CATEGORY_ICONS[iconKey] ?? "pricetag-outline";
}

export const ACCOUNT_ICON_OPTIONS = Object.keys(ACCOUNT_ICONS);
export const CATEGORY_ICON_OPTIONS = Object.keys(CATEGORY_ICONS);
