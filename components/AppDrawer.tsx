import { useCallback, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassSurface } from "@/components/GlassSurface";
import { InfoModal } from "@/components/InfoModal";
import { useKeydown } from "@/hooks/useKeydown";
import { downloadTextFile } from "@/lib/download";
import { getLogText, log } from "@/lib/logger";
import { webClickable, webFocusableProps, webFontDisplay } from "@/lib/web";
import { colors } from "@/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const ITEMS: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
}[] = [
  { label: "Settings", icon: "settings-outline", href: "/preferences" },
  { label: "Data", icon: "folder-outline", href: "/data" },
  { label: "Support", icon: "help-circle-outline", href: "/help" },
  { label: "Reset", icon: "trash-outline", href: "/reset" },
];

export function AppDrawer({ visible, onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<string | null>(null);

  useKeydown(
    visible,
    useCallback(
      (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      },
      [onClose],
    ),
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} />
        <GlassSurface
          elevated
          style={[
            styles.panel,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
          ]}
        >
          <Text style={styles.brand}>Fredkin</Text>
          <Text style={styles.sub}>Fredkin by NandGateLabs</Text>
          <Text style={styles.tag}>Offline ledger. Your device only.</Text>
          <View style={styles.list}>
            {ITEMS.map((item, index) => (
              <Pressable
                key={item.href}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityHint={`Menu item ${index + 1} of ${ITEMS.length}`}
                onPress={() => {
                  onClose();
                  router.push(item.href as never);
                }}
                {...webFocusableProps}
                style={({ pressed }) => [
                  styles.item,
                  webClickable,
                  pressed && styles.itemPressed,
                ]}
              >
                <Ionicons name={item.icon} size={20} color={colors.accent} />
                <Text style={styles.itemLabel}>{item.label}</Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Export Logs"
              onPress={() => {
                void (async () => {
                  try {
                    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
                    const name = `fredkin-logs_${stamp}.txt`;
                    const saved = await downloadTextFile(name, getLogText(), "text/plain");
                    log.info("Logs exported", saved.locationLabel);
                    setStatus(`Logs saved:\n${saved.locationLabel}`);
                  } catch (e) {
                    log.error("Log export failed", e);
                    setStatus(e instanceof Error ? e.message : "Log export failed");
                  }
                })();
              }}
              {...webFocusableProps}
              style={({ pressed }) => [
                styles.item,
                webClickable,
                pressed && styles.itemPressed,
              ]}
            >
              <Ionicons name="bug-outline" size={20} color={colors.accent} />
              <Text style={styles.itemLabel}>Export Logs</Text>
            </Pressable>
          </View>
          <InfoModal
            visible={status != null}
            title="Export Logs"
            message={status ?? ""}
            onClose={() => setStatus(null)}
          />
        </GlassSurface>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row" },
  scrim: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  panel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    maxWidth: "82%",
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: 18,
  },
  brand: {
    color: colors.accent,
    fontSize: 26,
    fontWeight: "600",
    fontStyle: "italic",
    fontFamily: webFontDisplay,
  },
  sub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  tag: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 24,
  },
  list: { gap: 4 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  itemPressed: {
    backgroundColor: colors.accentSoft,
  },
  itemLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
});
