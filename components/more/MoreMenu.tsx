import { useCallback, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { InfoModal } from "@/components/InfoModal";
import { useKeydown } from "@/hooks/useKeydown";
import { downloadTextFile } from "@/lib/download";
import { getLogText, log } from "@/lib/logger";
import { closeWebDialog } from "@/lib/webDialog";
import { webClickable, webFocusableProps, webFontDisplay } from "@/lib/web";
import { colors } from "@/theme";

export type MoreNavItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
  /** Digit shortcut while More is open (web). */
  shortcut: string;
};

/** People is a header pane on web. */
export const MORE_MANAGE_ITEMS: MoreNavItem[] =
  Platform.OS === "web"
    ? []
    : [
        {
          label: "People",
          icon: "people-outline",
          href: "/people",
          shortcut: "p",
        },
      ];

export const MORE_APP_ITEMS: MoreNavItem[] = [
  {
    label: "Settings",
    icon: "settings-outline",
    href: "/preferences",
    shortcut: "1",
  },
  {
    label: "Data",
    icon: "folder-outline",
    href: "/data",
    shortcut: "2",
  },
  {
    label: "Support",
    icon: "help-circle-outline",
    href: "/help",
    shortcut: "3",
  },
  {
    label: "Reset",
    icon: "trash-outline",
    href: "/reset",
    shortcut: "4",
  },
];

type Props = {
  /** When false, skip Esc handling (parent owns it). */
  handleEscape?: boolean;
};

/** Shared More menu body (web stack dialog + shortcuts). */
export function MoreMenu({ handleEscape = true }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [logStatus, setLogStatus] = useState<string | null>(null);
  // Transparent modals keep /more mounted under Settings — only handle keys when topmost.
  const isTop = pathname === "/more";

  useKeydown(
    handleEscape && isTop,
    useCallback(
      (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopImmediatePropagation();
          log.debug("shortcut Esc close more");
          closeWebDialog(router);
          return;
        }
        const item = [...MORE_MANAGE_ITEMS, ...MORE_APP_ITEMS].find(
          (row) => row.shortcut === event.key,
        );
        if (item) {
          event.preventDefault();
          log.debug("shortcut more item", { key: event.key, href: item.href });
          router.push(item.href as never);
        }
      },
      [router],
    ),
    { ignoreWhenTyping: true },
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>Fredkin</Text>
          <Text style={styles.tagline}>Fredkin by NandGateLabs</Text>
          <Text style={styles.sub}>Offline ledger. Your device only.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close more"
          onPress={() => closeWebDialog(router)}
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
        {MORE_MANAGE_ITEMS.length > 0 ? (
          <>
            <Text style={styles.section}>Manage</Text>
            {MORE_MANAGE_ITEMS.map((item) => (
              <Pressable
                key={item.href}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => {
                  log.debug("ui more navigate", { href: item.href });
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
                <View style={styles.itemText}>
                  <Text style={styles.itemLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>
            ))}
          </>
        ) : null}

        <Text
          style={[
            styles.section,
            MORE_MANAGE_ITEMS.length > 0 && styles.sectionSpaced,
          ]}
        >
          App
        </Text>
        {MORE_APP_ITEMS.map((item) => (
          <Pressable
            key={item.href}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => {
              log.debug("ui more navigate", { href: item.href });
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
            <View style={styles.itemText}>
              <Text style={styles.itemLabel}>{item.label}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
            />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
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
  sectionSpaced: {
    marginTop: 16,
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
  itemText: { flex: 1, minWidth: 0 },
  itemLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
});
