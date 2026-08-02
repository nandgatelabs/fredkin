import { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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

type NavItem = {
  label: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
};

const APP: NavItem[] = [
  { label: "Settings", icon: "settings-outline", href: "/preferences" },
  { label: "Data", icon: "folder-outline", href: "/data" },
  { label: "Support", icon: "help-circle-outline", href: "/help" },
  { label: "Reset", icon: "trash-outline", href: "/reset" },
];

/** Web: centered ~50% More dialog (native keeps the edge drawer). */
export function MorePane({ visible, onClose }: Props) {
  const router = useRouter();
  const [logStatus, setLogStatus] = useState<string | null>(null);

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

  function go(href: string) {
    onClose();
    router.push(href as never);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.cardWrap}
          onPress={(e) => e.stopPropagation?.()}
        >
          <GlassSurface elevated style={styles.card}>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.brand}>Fredkin</Text>
                <Text style={styles.tagline}>Fredkin by NandGateLabs</Text>
                <Text style={styles.sub}>Offline ledger. Your device only.</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close more"
                onPress={onClose}
                hitSlop={10}
                {...webFocusableProps}
                style={webClickable}
              >
                <Ionicons name="close" size={22} color={colors.accent} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.section}>App</Text>
              {APP.map((item) => (
                <MoreRow
                  key={item.href}
                  item={item}
                  onPress={() => go(item.href)}
                />
              ))}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Export Logs"
                onPress={() => {
                  void (async () => {
                    try {
                      const stamp = new Date()
                        .toISOString()
                        .replace(/[:.]/g, "-");
                      const name = `fredkin-logs_${stamp}.txt`;
                      const saved = await downloadTextFile(
                        name,
                        getLogText(),
                        "text/plain",
                      );
                      log.info("Logs exported", saved.locationLabel);
                      setLogStatus(`Logs saved:\n${saved.locationLabel}`);
                    } catch (e) {
                      log.error("Log export failed", e);
                      setLogStatus(
                        e instanceof Error ? e.message : "Log export failed",
                      );
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
                <View style={styles.itemText}>
                  <Text style={styles.itemLabel}>Export Logs</Text>
                </View>
              </Pressable>
            </ScrollView>

            <InfoModal
              visible={logStatus != null}
              title="Export Logs"
              message={logStatus ?? ""}
              onClose={() => setLogStatus(null)}
            />
          </GlassSurface>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MoreRow({ item, onPress }: { item: NavItem; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.label}
      onPress={onPress}
      {...webFocusableProps}
      style={({ pressed }) => [
        styles.item,
        webClickable,
        pressed && styles.itemPressed,
      ]}
    >
      <Ionicons name={item.icon} size={20} color={colors.accent} />
      <View style={styles.itemText}>
        <Text style={styles.itemLabel}>{item.label}</Text>
        {item.description ? (
          <Text style={styles.itemDesc}>{item.description}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  cardWrap: {
    width: "50%",
    minWidth: 380,
    maxWidth: 560,
    height: "50%",
    minHeight: 360,
    maxHeight: 560,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 12,
  },
  brand: {
    color: colors.accent,
    fontSize: 24,
    fontWeight: "600",
    fontStyle: "italic",
    fontFamily: webFontDisplay,
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  sub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  scroll: { flex: 1, minHeight: 0 },
  scrollContent: { paddingBottom: 8 },
  section: {
    color: colors.accentMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 4,
    marginLeft: 10,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  itemPressed: {
    backgroundColor: colors.accentSoft,
  },
  itemText: { flex: 1, gap: 2 },
  itemLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  itemDesc: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
