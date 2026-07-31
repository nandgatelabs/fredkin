import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button } from "@/components/ui/Button";
import { useKeydown } from "@/hooks/useKeydown";
import { colors } from "@/theme";
import { layout } from "@/theme/layout";

type Props = {
  visible: boolean;
  categoryName: string;
  initialLimit?: number;
  onCancel: () => void;
  onSave: (limit: number) => void | Promise<void>;
};

export function BudgetEditorModal({
  visible,
  categoryName,
  initialLimit = 0,
  onCancel,
  onSave,
}: Props) {
  const [amount, setAmount] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setAmount(String(initialLimit));
    setError(null);
    setBusy(false);
  }, [visible, initialLimit]);

  useKeydown(
    visible,
    useCallback(
      (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
      },
      [onCancel],
    ),
  );

  async function save() {
    const n = Number(amount);
    if (Number.isNaN(n) || n < 0) {
      setError("Enter a valid amount (0 or more)");
      return;
    }
    setBusy(true);
    try {
      await onSave(n);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Set budget</Text>
          <Text style={styles.category}>{categoryName}</Text>
          <Text style={styles.label}>Monthly limit</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            style={styles.input}
            placeholderTextColor={colors.accentMuted}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Button label="CANCEL" variant="secondary" onPress={onCancel} style={styles.btn} />
            <Button
              label={busy ? "…" : "SAVE"}
              variant="primary"
              onPress={() => void save()}
              busy={busy}
              style={styles.btn}
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
    padding: 16,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    width: "100%",
    maxWidth: layout.dialogMaxWidth,
    alignSelf: "center",
    gap: 10,
  },
  title: { color: colors.accent, fontSize: 17, fontWeight: "700" },
  category: { color: colors.text, fontSize: 15, fontWeight: "600" },
  label: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.inputBg,
    fontSize: 16,
  },
  error: { color: colors.danger, fontSize: 13 },
  actions: { flexDirection: "row", gap: 10, marginTop: 8 },
  btn: { flex: 1 },
});
