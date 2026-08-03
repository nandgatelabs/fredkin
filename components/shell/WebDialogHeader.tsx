import { useCallback } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useKeydown } from "@/hooks/useKeydown";
import { log } from "@/lib/logger";
import {
  closeWebDialog,
  dismissWebDialog,
  webDialogBackLabel,
  webDialogCloseLabel,
} from "@/lib/webDialog";
import { webClickable, webFocusableProps } from "@/lib/web";
import { useMorePaneStore } from "@/store/morePane";
import { colors } from "@/theme";

type Props = {
  title: string;
  /** When set, shows SAVE on the right (web: after CLOSE). */
  onSave?: () => void;
  saveBusy?: boolean;
  saveLabel?: string;
  /**
   * Esc triggers Back (not Close). Set false while a nested sheet/modal
   * owns Escape, or while a destructive action is busy.
   */
  escapeBack?: boolean;
};

/**
 * Dialog chrome: Back + Close[+ Save].
 * Native uses chevron / close icons; web keeps text labels.
 */
export function WebDialogHeader({
  title,
  onSave,
  saveBusy = false,
  saveLabel = "SAVE",
  escapeBack = true,
}: Props) {
  const router = useRouter();
  const isWeb = Platform.OS === "web";

  const onBack = useCallback(() => {
    log.debug("ui dialog back", { title, platform: Platform.OS });
    dismissWebDialog(router);
  }, [router, title]);

  const onClose = useCallback(() => {
    log.debug("ui dialog close", { title, platform: Platform.OS });
    useMorePaneStore.getState().clearReturnToMore();
    closeWebDialog(router);
  }, [router, title]);

  useKeydown(
    isWeb && escapeBack,
    useCallback(
      (event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopImmediatePropagation();
        onBack();
      },
      [onBack],
    ),
    { capture: true },
  );

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={onBack}
        hitSlop={10}
        style={[styles.sideHit, webClickable]}
        {...webFocusableProps}
      >
        {isWeb ? (
          <Text style={styles.side}>{webDialogBackLabel}</Text>
        ) : (
          <Ionicons name="chevron-back" size={24} color={colors.accent} />
        )}
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          hitSlop={10}
          style={[styles.sideHit, webClickable]}
          {...webFocusableProps}
        >
          {isWeb ? (
            <Text style={[styles.side, styles.sideEnd]}>{webDialogCloseLabel}</Text>
          ) : (
            <Ionicons name="close" size={24} color={colors.accent} />
          )}
        </Pressable>
        {onSave ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save"
            onPress={() => {
              log.debug("ui dialog save", { title });
              onSave();
            }}
            hitSlop={10}
            disabled={saveBusy}
            style={webClickable}
            {...webFocusableProps}
          >
            <Text
              style={[
                styles.side,
                styles.sideEnd,
                styles.save,
                saveBusy && styles.busy,
              ]}
            >
              {saveBusy ? "…" : saveLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  title: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "center",
    flex: 1,
  },
  sideHit: {
    minWidth: 36,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  side: {
    color: colors.accent,
    fontWeight: "600",
    fontSize: 13,
  },
  sideEnd: {
    textAlign: "right",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 36,
    justifyContent: "flex-end",
  },
  save: {
    fontWeight: "700",
  },
  busy: {
    opacity: 0.5,
  },
});
