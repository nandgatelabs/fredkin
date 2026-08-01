import { Platform, StyleSheet, View } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { WebAppShortcuts } from "@/components/WebAppShortcuts";
import { webFontBody } from "@/lib/web";
import { colors } from "@/theme";

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <WebAppShortcuts />
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarSafeAreaInsets: { bottom: 0 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          // Web device-mode viewports were clipping labels at height 60.
          height: Platform.OS === "web" ? 72 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === "web" ? 12 : 8,
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
          title: "Records",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: "Analysis",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pie-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: "Budgets",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calculator-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: "Accounts",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Categories",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
    </View>
  );
}
