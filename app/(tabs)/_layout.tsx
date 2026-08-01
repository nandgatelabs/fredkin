import { Platform, StyleSheet, View } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WebAppShortcuts } from "@/components/WebAppShortcuts";
import { webFontBody } from "@/lib/web";
import { colors } from "@/theme";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // Web: fixed bar (device-mode). Native: sit above 3-button system nav via insets.
  const tabBarHeight =
    Platform.OS === "web" ? 72 : 56 + Math.max(insets.bottom, 8);
  const tabBarPadBottom =
    Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);

  return (
    <View style={{ flex: 1 }}>
      <WebAppShortcuts />
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: tabBarPadBottom,
          overflow: "visible",
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          fontFamily: webFontBody,
          marginBottom: Platform.OS === "web" ? 2 : 0,
        },
        tabBarItemStyle: Platform.OS === "web" ? { cursor: "pointer" } : undefined,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Events",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: "Insights",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pie-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: "Wallets",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Event Type",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
    </View>
  );
}
