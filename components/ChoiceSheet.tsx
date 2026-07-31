import { useCallback } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useKeydown } from "@/hooks/useKeydown";
import { webClickable, webFocusableProps } from "@/lib/web";
import { colors } from "@/theme";
import { layout } from "@/theme/layout";

export type ChoiceOption<T extends string> = {
  id: T;
  label: string;
  description?: string;
};

type Props<T extends string> = {
  visible: boolean;
  title: string;
  options: ChoiceOption<T>[];
  selected: T;
  onSelect: (id: T) => void;
  onClose: () => void;
};

export function ChoiceSheet<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: Props<T>) {
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
          <Text style={styles.title}>{title}</Text>
          {options.map((opt) => {
            const on = opt.id === selected;
            return (
              <Pressable
                key={opt.id}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  onSelect(opt.id);
                  onClose();
                }}
                {...webFocusableProps}
                style={({ pressed }) => [
                  styles.option,
                  webClickable,
                  on && styles.optionOn,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, on && styles.optionLabelOn]}>
                    {opt.label}
                  </Text>
                  {opt.description ? (
                    <Text style={styles.optionDesc}>{opt.description}</Text>
                  ) : null}
                </View>
                {on ? (
                  <Ionicons name="checkmark" size={20} color={colors.accent} />
                ) : null}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    width: "100%",
    maxWidth: layout.dialogMaxWidth,
    alignSelf: "center",
    gap: 4,
  },
  title: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  optionOn: {
    backgroundColor: "rgba(232, 212, 138, 0.1)",
  },
  pressed: { opacity: 0.9 },
  optionText: { flex: 1, gap: 2 },
  optionLabel: { color: colors.text, fontSize: 15, fontWeight: "600" },
  optionLabelOn: { color: colors.accent },
  optionDesc: { color: colors.textSecondary, fontSize: 12 },
});
