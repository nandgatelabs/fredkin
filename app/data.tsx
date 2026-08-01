import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useKeydown } from "@/hooks/useKeydown";
import { webClickable, webFocusableProps } from "@/lib/web";
import { colors } from "@/theme";

const ITEMS: {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
}[] = [
  {
    label: "Export",
    description: "Download CSV for a date range",
    icon: "download-outline",
    href: "/export-csv",
  },
  {
    label: "Import",
    description: "Bring in CSV rows",
    icon: "cloud-upload-outline",
    href: "/import-csv",
  },
  {
    label: "Backup",
    description: "Write a .mbak snapshot",
    icon: "archive-outline",
    href: "/backup",
  },
  {
    label: "Restore",
    description: "Restore from a .mbak file",
    icon: "refresh-outline",
    href: "/backup",
  },
];

export default function DataScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useKeydown(
    true,
    useCallback(
      (event) => {
        if (event.key === "Escape") router.back();
      },
      [router],
    ),
  );

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          hitSlop={10}
          style={webClickable}
          {...webFocusableProps}
        >
          <Text style={styles.back}>✕ CLOSE</Text>
        </Pressable>
        <Text style={styles.title}>Data</Text>
        <View style={{ width: 64 }} />
      </View>

      <Text style={styles.body}>
        Export, import, backup, and restore stay on this device. Nothing is uploaded.
      </Text>

      {ITEMS.map((item) => (
        <Pressable
          key={`${item.label}-${item.href}`}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          onPress={() => router.push(item.href as never)}
          style={({ pressed }) => [
            styles.row,
            webClickable,
            pressed && styles.rowPressed,
          ]}
          {...webFocusableProps}
        >
          <Ionicons name={item.icon} size={22} color={colors.accent} />
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowDesc}>{item.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  back: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
    width: 64,
  },
  title: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: "700",
  },
  body: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  rowPressed: {
    backgroundColor: "rgba(232, 212, 138, 0.1)",
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  rowDesc: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
