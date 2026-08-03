import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WebCenterFrame } from "@/components/shell/WebCenterFrame";
import { WebDialogHeader } from "@/components/shell/WebDialogHeader";
import { log } from "@/lib/logger";
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

  return (
    <WebCenterFrame>
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 },
        ]}
      >
        <WebDialogHeader title="Data" />

        <Text style={styles.body}>
          Export, import, backup, and restore stay on this device. Nothing is uploaded.
        </Text>

        {ITEMS.map((item) => (
          <Pressable
            key={`${item.label}-${item.href}`}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => {
              log.debug("ui data navigate", { label: item.label, href: item.href });
              router.push(item.href as never);
            }}
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
    </WebCenterFrame>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  body: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: { opacity: 0.7 },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { color: colors.text, fontSize: 16, fontWeight: "700" },
  rowDesc: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
});
