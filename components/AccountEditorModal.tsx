import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/ui/Button";
import { useKeydown } from "@/hooks/useKeydown";
import {
  ACCOUNT_ICON_OPTIONS,
  accountIcon,
  type AccountIconKey,
} from "@/lib/icons";
import { webClickable } from "@/lib/web";
import { colors } from "@/theme";
import { layout } from "@/theme/layout";

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

  const handleSave = useCallback(async () => {
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
  }, [amount, iconKey, name, onSave]);

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
          const tag = (event.target as HTMLElement | null)?.tagName?.toLowerCase();
          if (tag === "textarea") return;
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
            {mode === "edit" ? "Edit wallet" : "Add new wallet"}
          </Text>
          {Platform.OS === "web" ? (
            <Text style={styles.hint}>Esc cancel · Enter save</Text>
          ) : null}

          <View style={styles.fieldRow}>
            <Text style={styles.label}>Initial amount</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={styles.input}
              selectTextOnFocus
              autoFocus
            />
          </View>
          <Text style={styles.note}>*Initial amount will not be reflected in Insights</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            selectTextOnFocus
          />

          <Text style={[styles.label, { marginTop: 8 }]}>Icon</Text>
          <View style={styles.iconRow}>
            {ACCOUNT_ICON_OPTIONS.map((key) => {
              const selected = iconKey === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setIconKey(key as AccountIconKey)}
                  style={[
                    styles.iconBtn,
                    webClickable,
                    selected && styles.iconBtnSelected,
                  ]}
                >
                  <Ionicons
                    name={accountIcon(key)}
                    size={22}
                    color={selected ? colors.onAccent : colors.accent}
                  />
                </Pressable>
              );
            })}
          </View>

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
  fieldRow: { gap: 6 },
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
  note: { color: colors.textSecondary, fontSize: 12, marginBottom: 4 },
  iconRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    padding: 10,
    backgroundColor: colors.inputBg,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  iconBtnSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  error: { color: colors.danger, fontSize: 13 },
  actions: { flexDirection: "row", gap: 12, marginTop: 12 },
  actionBtn: { flex: 1 },
});
