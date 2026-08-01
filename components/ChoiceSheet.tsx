import { useCallback } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useKeydown } from "@/hooks/useKeydown";
import { useThemeColors } from "@/hooks/useThemeColors";
import { webClickable, webFocusableProps } from "@/lib/web";
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
  const c = useThemeColors();

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
      <Pressable
        style={[styles.backdrop, { backgroundColor: c.overlay }]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: c.dialog,
              borderColor: c.border,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: c.accent }]}>{title}</Text>
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
                  on && { backgroundColor: c.accentSoft },
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.optionText}>
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: on ? c.accent : c.text },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {opt.description ? (
                    <Text style={[styles.optionDesc, { color: c.textSecondary }]}>
                      {opt.description}
                    </Text>
                  ) : null}
                </View>
                {on ? (
                  <Ionicons name="checkmark" size={20} color={c.accent} />
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
    justifyContent: "center",
    padding: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    width: "100%",
    maxWidth: layout.dialogMaxWidth,
    alignSelf: "center",
    gap: 4,
  },
  title: {
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
  pressed: { opacity: 0.9 },
  optionText: { flex: 1, gap: 2 },
  optionLabel: { fontSize: 15, fontWeight: "600" },
  optionDesc: { fontSize: 12 },
});
