import { View } from "react-native";
import { Tabs } from "expo-router";

import { MoreEdge } from "@/components/MoreEdge";
import { WebAppShortcuts } from "@/components/WebAppShortcuts";

/** Web: no bottom tab bar — primary nav lives in the header. */
export default function TabsLayoutWeb() {
  return (
    <View style={{ flex: 1 }}>
      <WebAppShortcuts />
      <Tabs
        tabBar={() => null}
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
