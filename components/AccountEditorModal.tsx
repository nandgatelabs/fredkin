import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  ACCOUNT_ICON_OPTIONS,
  accountIcon,
  type AccountIconKey,
} from "@/lib/icons";
import { colors } from "@/theme";

export type AccountEditorValues = {
  name: string;
  opening_balance: number;
  icon_key: string;
};

type Props = {
  visible: boolean;
  mode: "create" | "edit";
  initial?: Partial<AccountEditorValues>;
  onCancel: () => void;
  onSave: (values: AccountEditorValues) => void | Promise<void>;
};

export function AccountEditorModal({
  visible,
  mode,
  initial,
  onCancel,
  onSave,
}: Props) {
  const [name, setName] = useState("Untitled");
  const [amount, setAmount] = useState("0");
  const [iconKey, setIconKey] = useState<string>("cash");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName(initial?.name?.trim() ? initial.name : mode === "create" ? "Untitled" : "");
    setAmount(
      initial?.opening_balance != null ? String(initial.opening_balance) : "0",
    );
    setIconKey(initial?.icon_key ?? "cash");
    setError(null);
    setBusy(false);
  }, [visible, initial, mode]);

  async function handleSave() {
    const trimmed = name.trim() || "Untitled";
    const parsed = Number(amount);
    if (Number.isNaN(parsed)) {
      setError("Initial amount must be a number");
      return;
    }
    try {
      setBusy(true);
      await onSave({
        name: trimmed,
        opening_balance: parsed,
        icon_key: iconKey,
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
            {mode === "edit" ? "Edit account" : "Add new account"}
          </Text>

          <View style={styles.fieldRow}>
            <Text style={styles.label}>Initial amount</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>
          <Text style={styles.note}>*Initial amount will not be reflected in analysis</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} />

          <Text style={[styles.label, { marginTop: 8 }]}>Icon</Text>
          <View style={styles.iconRow}>
            {ACCOUNT_ICON_OPTIONS.map((key) => {
              const selected = iconKey === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setIconKey(key as AccountIconKey)}
                  style={[styles.iconBtn, selected && styles.iconBtnSelected]}
                >
                  <Ionicons
                    name={accountIcon(key)}
                    size={22}
                    color={selected ? colors.background : colors.accent}
                  />
                </Pressable>
              );
            })}
          </View>

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
  },
  title: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  fieldRow: { gap: 6 },
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
  note: { color: colors.textSecondary, fontSize: 12, marginBottom: 4 },
  iconRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  iconBtnSelected: {
    backgroundColor: colors.accent,
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
