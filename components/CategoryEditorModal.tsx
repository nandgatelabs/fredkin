import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { CategoryType } from "@/db/types";
import {
  CATEGORY_ICON_OPTIONS,
  categoryColor,
  categoryIcon,
} from "@/lib/icons";
import { colors } from "@/theme";

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

  async function handleSave() {
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
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {mode === "edit" ? "Edit category" : "Add new category"}
          </Text>

          {mode === "create" ? (
            <View style={styles.typeRow}>
              <Text style={styles.label}>Type:</Text>
              <TypeOption
                label="INCOME"
                selected={type === "income"}
                onPress={() => setType("income")}
              />
              <TypeOption
                label="EXPENSE"
                selected={type === "expense"}
                onPress={() => setType("expense")}
              />
            </View>
          ) : null}

          <Text style={styles.label}>Name</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} />

          <Text style={[styles.label, { marginTop: 8 }]}>Icon</Text>
          <ScrollView style={styles.iconScroll} contentContainerStyle={styles.iconGrid}>
            {CATEGORY_ICON_OPTIONS.map((opt) => {
              const selected = iconKey === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setIconKey(opt.key)}
                  style={[styles.iconCell, selected && styles.iconCellSelected]}
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
            <Pressable style={styles.actionBtn} onPress={onCancel} disabled={busy}>
              <Text style={styles.actionLabel}>CANCEL</Text>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={handleSave} disabled={busy}>
              <Text style={styles.actionLabel}>{busy ? "…" : "SAVE"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
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
    <Pressable onPress={onPress} style={styles.typeOpt}>
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
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accentMuted,
    padding: 18,
    gap: 8,
    maxHeight: "90%",
  },
  title: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  label: { color: colors.accent, fontSize: 14, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: colors.accentMuted,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 16,
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  typeOpt: { flexDirection: "row", alignItems: "center", gap: 4 },
  typeLabel: { color: colors.accent, fontWeight: "600", fontSize: 13 },
  iconScroll: { maxHeight: 160 },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
  },
  iconCell: {
    padding: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  iconCellSelected: {
    borderColor: colors.accent,
    backgroundColor: "rgba(229,211,138,0.12)",
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
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionLabel: { color: colors.accent, fontWeight: "700", fontSize: 14 },
});
