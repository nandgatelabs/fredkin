import { useCallback } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useKeydown } from "@/hooks/useKeydown";
import { webClickable } from "@/lib/web";
import { type ViewMode, useSettingsStore } from "@/store/settings";
import { colors } from "@/theme";
import { layout } from "@/theme/layout";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: "daily", label: "DAILY" },
  { key: "weekly", label: "WEEKLY" },
  { key: "monthly", label: "MONTHLY" },
  { key: "months3", label: "3 MONTHS" },
  { key: "months6", label: "6 MONTHS" },
  { key: "yearly", label: "YEARLY" },
];

export function DisplayOptionsModal({ visible, onClose }: Props) {
  const viewMode = useSettingsStore((s) => s.viewMode);
  const showTotal = useSettingsStore((s) => s.showTotal);
  const carryOver = useSettingsStore((s) => s.carryOver);
  const setViewMode = useSettingsStore((s) => s.setViewMode);
  const setShowTotal = useSettingsStore((s) => s.setShowTotal);
  const setCarryOver = useSettingsStore((s) => s.setCarryOver);

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
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Display options</Text>

          <Text style={styles.section}>View mode:</Text>
          {VIEW_MODES.map((mode) => {
            const selected = viewMode === mode.key;
            return (
              <Pressable
                key={mode.key}
                style={[styles.row, webClickable]}
                onPress={() => void setViewMode(mode.key)}
              >
                <Ionicons
                  name={selected ? "checkmark" : "remove"}
                  size={18}
                  color={selected ? colors.accent : "transparent"}
                />
                <Text style={[styles.rowLabel, selected && styles.rowLabelOn]}>
                  {mode.label}
                </Text>
              </Pressable>
            );
          })}

          <Text style={[styles.section, { marginTop: 12 }]}>Show net:</Text>
          <View style={styles.inline}>
            <Choice
              label="YES"
              selected={showTotal}
              onPress={() => void setShowTotal(true)}
            />
            <Choice
              label="NO"
              selected={!showTotal}
              onPress={() => void setShowTotal(false)}
            />
          </View>

          <Text style={[styles.section, { marginTop: 12 }]}>Carry over:</Text>
          <View style={styles.inline}>
            <Choice
              label="ON"
              selected={carryOver}
              onPress={() => void setCarryOver(true)}
            />
            <Choice
              label="OFF"
              selected={!carryOver}
              onPress={() => void setCarryOver(false)}
            />
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={16} color={colors.accentMuted} />
            <Text style={styles.info}>
              With Carry over enabled, monthly surplus will be added to the next month.
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.choice, webClickable]} onPress={onPress}>
      <Ionicons
        name={selected ? "checkmark" : "remove"}
        size={18}
        color={selected ? colors.accent : "transparent"}
      />
      <Text style={[styles.rowLabel, selected && styles.rowLabelOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    width: "100%",
    maxWidth: layout.dialogMaxWidth,
    alignSelf: "center",
  },
  title: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
  },
  section: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 7,
    paddingHorizontal: 4,
  },
  rowLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  rowLabelOn: {
    color: colors.accent,
  },
  inline: {
    flexDirection: "row",
    gap: 24,
    paddingLeft: 4,
  },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  infoRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    alignItems: "flex-start",
  },
  info: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
});
