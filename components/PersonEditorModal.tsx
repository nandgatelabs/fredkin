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
  mode: "create" | "edit";
  initial?: { name?: string; note?: string };
  onCancel: () => void;
  onSave: (values: { name: string; note: string }) => void | Promise<void>;
};

export function PersonEditorModal({
  visible,
  mode,
  initial,
  onCancel,
  onSave,
}: Props) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? "");
    setNote(initial?.note ?? "");
    setError(null);
    setBusy(false);
  }, [visible, initial]);

  const handleSave = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required");
      return;
    }
    try {
      setBusy(true);
      await onSave({ name: trimmed, note: note.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setBusy(false);
    }
  }, [name, note, onSave]);

  useKeydown(
    visible,
    useCallback(
      (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          if (!busy) onCancel();
        }
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
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
          <Text style={styles.title}>{mode === "create" ? "Add person" : "Edit person"}</Text>
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <TextInput
            style={[styles.input, styles.note]}
            placeholder="Note (optional)"
            placeholderTextColor={colors.textSecondary}
            value={note}
            onChangeText={setNote}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Button label="CANCEL" variant="ghost" onPress={onCancel} style={styles.btn} />
            <Button
              label="SAVE"
              variant="primary"
              onPress={() => void handleSave()}
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
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: colors.dialog,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    width: "100%",
    maxWidth: layout.dialogMaxWidth,
    alignSelf: "center",
  },
  title: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 8,
  },
  note: { minHeight: 64, textAlignVertical: "top" },
  error: { color: colors.expense, fontSize: 13, marginBottom: 8 },
  actions: { flexDirection: "row", gap: 12, marginTop: 8 },
  btn: { flex: 1 },
});
