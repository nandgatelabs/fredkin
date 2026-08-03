import { useCallback } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { useKeydown } from "@/hooks/useKeydown";
import {
  closeWebDialog,
  dismissWebDialog,
  webDialogBackLabel,
  webDialogCloseLabel,
} from "@/lib/webDialog";
import { webClickable, webFocusableProps } from "@/lib/web";
import { colors } from "@/theme";

type Props = {
  title: string;
  /** When set, shows SAVE on the right (web: after CLOSE). */
  onSave?: () => void;
  saveBusy?: boolean;
  saveLabel?: string;
  /**
   * Web: Esc triggers Back (not Close). Set false while a nested sheet/modal
   * owns Escape, or while a destructive action is busy.
   */
  escapeBack?: boolean;
};

/**
 * Dialog chrome: native keeps Close[/Save]; web gets Back + Close[+ Save].
 * Escape on web always follows Back.
 */
export function WebDialogHeader({
  title,
  onSave,
  saveBusy = false,
  saveLabel = "SAVE",
  escapeBack = true,
}: Props) {
  const router = useRouter();

  useKeydown(
    Platform.OS === "web" && escapeBack,
    useCallback(
      (event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        // Stop More (still mounted under this dialog) from also handling Esc as Close.
        event.stopImmediatePropagation();
        dismissWebDialog(router);
      },
      [router],
    ),
    { capture: true },
  );

  if (Platform.OS !== "web") {
    return (
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          hitSlop={10}
          style={webClickable}
          {...webFocusableProps}
        >
          <Text style={styles.side}>{webDialogCloseLabel}</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        {onSave ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save"
            onPress={onSave}
            hitSlop={10}
            disabled={saveBusy}
            style={webClickable}
            {...webFocusableProps}
          >
            <Text style={[styles.side, styles.sideEnd, saveBusy && styles.busy]}>
              {saveBusy ? "…" : saveLabel}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.sideSpacer} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={() => dismissWebDialog(router)}
        hitSlop={10}
        style={webClickable}
        {...webFocusableProps}
      >
        <Text style={styles.side}>{webDialogBackLabel}</Text>
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.right}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => closeWebDialog(router)}
          hitSlop={10}
          style={webClickable}
          {...webFocusableProps}
        >
          <Text style={[styles.side, styles.sideEnd]}>{webDialogCloseLabel}</Text>
        </Pressable>
        {onSave ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save"
            onPress={onSave}
            hitSlop={10}
            disabled={saveBusy}
            style={webClickable}
            {...webFocusableProps}
          >
            <Text style={[styles.side, styles.sideEnd, styles.save, saveBusy && styles.busy]}>
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
  },
  side: {
    color: colors.accent,
    fontWeight: "600",
    fontSize: 13,
  },
  sideEnd: {
    textAlign: "right",
  },
  sideSpacer: {
    width: 72,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 72,
    justifyContent: "flex-end",
  },
  save: {
    fontWeight: "700",
  },
  busy: {
    opacity: 0.5,
  },
});
