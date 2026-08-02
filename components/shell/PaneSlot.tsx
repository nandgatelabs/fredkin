import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ActionMenu } from "@/components/ActionMenu";
import { DisplayOptionsModal } from "@/components/DisplayOptionsModal";
import { AccountDetailPane } from "@/components/account/AccountDetailPane";
import { CategoriesPane } from "@/components/categories/CategoriesPane";
import { CategoryDetailPane } from "@/components/category/CategoryDetailPane";
import { EventsPane } from "@/components/events/EventsPane";
import { InsightsPane } from "@/components/insights/InsightsPane";
import { WalletsPane } from "@/components/wallets/WalletsPane";
import { webClickable, webFocusableProps, webTitle } from "@/lib/web";
import {
  ALL_PANES,
  PANE_LABELS,
  type PaneId,
} from "@/store/desktopView";
import { colors } from "@/theme";

type Detail =
  | { kind: "category"; id: string }
  | { kind: "account"; id: string }
  | null;

type Props = {
  paneId: PaneId;
  active?: boolean;
  onSelectPane: (pane: PaneId) => void;
  onMaximize?: () => void;
  onFocus?: () => void;
  /** Split mode: shared chrome + contained detail navigation. */
  splitChrome?: boolean;
};

/**
 * One desktop column: chrome (picker + maximize) + pane body + in-pane detail stack.
 */
export function PaneSlot({
  paneId,
  active = false,
  onSelectPane,
  onMaximize,
  onFocus,
  splitChrome = false,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [displayOpen, setDisplayOpen] = useState(false);
  const [detail, setDetail] = useState<Detail>(null);
  const [insightsEpoch, setInsightsEpoch] = useState(0);

  useEffect(() => {
    setDetail(null);
  }, [paneId]);

  const goCategory = (id: string) => setDetail({ kind: "category", id });
  const goAccount = (id: string) => setDetail({ kind: "account", id });
  const showChrome = splitChrome || onMaximize != null;
  const insightsInSplit = splitChrome && paneId === "insights";

  return (
    <View
      style={[styles.root, active && styles.rootActive]}
      onStartShouldSetResponder={() => {
        onFocus?.();
        return false;
      }}
    >
      {showChrome ? (
        <View style={styles.chrome}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Pane: ${PANE_LABELS[paneId]}`}
            onPress={() => {
              onFocus?.();
              setPickerOpen(true);
            }}
            {...webFocusableProps}
            {...webTitle("Switch pane")}
            style={[styles.pickerBtn, webClickable]}
          >
            <Text style={styles.pickerLabel}>{PANE_LABELS[paneId]}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.accent} />
          </Pressable>
          {insightsInSplit ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Display options"
              onPress={() => setDisplayOpen(true)}
              hitSlop={8}
              {...webFocusableProps}
              {...webTitle("Display options")}
              style={[styles.iconBtn, webClickable]}
            >
              <Ionicons name="options-outline" size={18} color={colors.accent} />
            </Pressable>
          ) : null}
          {onMaximize ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Expand to full screen"
              onPress={onMaximize}
              hitSlop={8}
              {...webFocusableProps}
              {...webTitle("Expand")}
              style={[styles.iconBtn, webClickable]}
            >
              <Ionicons name="expand-outline" size={18} color={colors.accent} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.body}>
        {detail?.kind === "category" ? (
          <CategoryDetailPane
            id={detail.id}
            embedded
            onClose={() => setDetail(null)}
          />
        ) : detail?.kind === "account" ? (
          <AccountDetailPane
            id={detail.id}
            embedded
            onClose={() => setDetail(null)}
          />
        ) : paneId === "events" ? (
          <EventsPane
            listBottomPad={24}
            showPeriodNav={!splitChrome}
            showPeriodLabel={!splitChrome}
          />
        ) : paneId === "insights" ? (
          <InsightsPane
            key={insightsEpoch}
            showDisplayOptions={!insightsInSplit}
            dense={insightsInSplit}
            contentBottomPad={40}
            onOpenCategory={goCategory}
            onOpenAccount={goAccount}
          />
        ) : paneId === "wallets" ? (
          <WalletsPane listBottomPad={40} onOpenAccount={goAccount} />
        ) : (
          <CategoriesPane listBottomPad={40} onOpenCategory={goCategory} />
        )}
      </View>

      <ActionMenu
        visible={pickerOpen}
        title="Show in pane"
        onClose={() => setPickerOpen(false)}
        items={ALL_PANES.map((id) => ({
          label: PANE_LABELS[id],
          onPress: () => onSelectPane(id),
        }))}
      />

      <DisplayOptionsModal
        visible={displayOpen}
        onClose={() => {
          setDisplayOpen(false);
          setInsightsEpoch((n) => n + 1);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  rootActive: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  chrome: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  pickerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  pickerLabel: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  body: { flex: 1, minHeight: 0 },
});
