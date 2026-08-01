import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/ui/Button";
import type { CategoryType } from "@/db/types";
import { useKeydown } from "@/hooks/useKeydown";
import {
  CATEGORY_ICON_OPTIONS,
  categoryColor,
  categoryIcon,
} from "@/lib/icons";
import { webClickable } from "@/lib/web";
import { colors } from "@/theme";
import { layout } from "@/theme/layout";

export type CategoryEditorValues = {
  name: string;
  type: CategoryType;
  icon_key: string;
  color: string;
};

type Props = {
  visible: boolean;
  mode: "create" | "edit";
  /** Type is editable only on create. */
  initial?: Partial<CategoryEditorValues>;
  onCancel: () => void;
  onSave: (values: CategoryEditorValues) => void | Promise<void>;
};

export function CategoryEditorModal({
  visible,
  mode,
  initial,
  onCancel,
  onSave,
}: Props) {
  const [name, setName] = useState("Untitled");
  const [type, setType] = useState<CategoryType>("expense");
  const [iconKey, setIconKey] = useState("restaurant");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName(initial?.name?.trim() ? initial.name : mode === "create" ? "Untitled" : "");
    setType(initial?.type ?? "expense");
    setIconKey(initial?.icon_key ?? "restaurant");
    setError(null);
    setBusy(false);
  }, [visible, initial, mode]);

  const handleSave = useCallback(async () => {
    const trimmed = name.trim() || "Untitled";
    try {
      setBusy(true);
      await onSave({
        name: trimmed,
        type,
        icon_key: iconKey,
        color: categoryColor(iconKey),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setBusy(false);
    }
  }, [iconKey, name, onSave, type]);

  useKeydown(
    visible,
    useCallback(
      (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          if (!busy) onCancel();
          return;
        }
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          if (!busy) void handleSave();
        }
      },
      [busy, handleSave, onCancel],
    ),
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>
            {mode === "edit" ? "Edit event type" : "Add event type"}
          </Text>
          {Platform.OS === "web" ? (
            <Text style={styles.hint}>Esc cancel · Enter save</Text>
          ) : null}

          {mode === "create" ? (
            <View style={styles.typeRow}>
              <Text style={styles.label}>Type</Text>
              <TypeOption
                label="INCOME"
                selected={type === "income"}
                onPress={() => setType("income")}
              />
              <TypeOption
                label="SPEND"
                selected={type === "expense"}
                onPress={() => setType("expense")}
              />
            </View>
          ) : null}

          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            selectTextOnFocus
            autoFocus
          />

          <Text style={[styles.label, { marginTop: 8 }]}>Icon</Text>
          <ScrollView style={styles.iconScroll} contentContainerStyle={styles.iconGrid}>
            {CATEGORY_ICON_OPTIONS.map((opt) => {
              const selected = iconKey === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setIconKey(opt.key)}
                  style={[
                    styles.iconCell,
                    webClickable,
                    selected && styles.iconCellSelected,
                  ]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: opt.color }]}>
                    <Ionicons name={categoryIcon(opt.key)} size={18} color="#fff" />
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button
              label="CANCEL"
              variant="ghost"
              onPress={onCancel}
              disabled={busy}
              style={styles.actionBtn}
            />
            <Button
              label="SAVE"
              variant="primary"
              onPress={() => void handleSave()}
              busy={busy}
              style={styles.actionBtn}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function TypeOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.typeOpt, webClickable, selected && styles.typeOptOn]}
    >
      <Ionicons
        name={selected ? "checkmark-circle" : "ellipse-outline"}
        size={18}
        color={colors.accent}
      />
      <Text style={styles.typeLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 8,
    maxHeight: "90%",
    width: "100%",
    maxWidth: layout.dialogMaxWidth,
    alignSelf: "center",
  },
  title: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: "center",
    marginBottom: 6,
  },
  label: { color: colors.accentMuted, fontSize: 13, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    backgroundColor: colors.inputBg,
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  typeOpt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  typeOptOn: {
    borderColor: colors.accent,
    backgroundColor: "rgba(232, 212, 138, 0.1)",
  },
  typeLabel: { color: colors.accent, fontWeight: "600", fontSize: 13 },
  iconScroll: { maxHeight: 160 },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    padding: 10,
    backgroundColor: colors.inputBg,
  },
  iconCell: {
    padding: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  iconCellSelected: {
    borderColor: colors.accent,
    backgroundColor: "rgba(232, 212, 138, 0.12)",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  error: { color: colors.danger, fontSize: 13 },
  actions: { flexDirection: "row", gap: 12, marginTop: 12 },
  actionBtn: { flex: 1 },
});
