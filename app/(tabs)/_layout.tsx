import { View } from "react-native";
import { Tabs } from "expo-router";

import { MoreEdge } from "@/components/MoreEdge";
import { ShellTabBar } from "@/components/ShellTabBar";
import { WebAppShortcuts } from "@/components/WebAppShortcuts";

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <WebAppShortcuts />
      <Tabs
        tabBar={(props) => <ShellTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Events" }} />
        <Tabs.Screen name="analysis" options={{ title: "Insights" }} />
        <Tabs.Screen name="budgets" options={{ href: null }} />
        <Tabs.Screen name="accounts" options={{ href: null }} />
        <Tabs.Screen name="categories" options={{ href: null }} />
      </Tabs>
      <MoreEdge />
    </View>
  );
}
