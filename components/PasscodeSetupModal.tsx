import { useCallback, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { useKeydown } from "@/hooks/useKeydown";
import { hashPasscode, isValidPin, randomSalt } from "@/lib/passcode";
import { colors } from "@/theme";
import { layout } from "@/theme/layout";

type Props = {
  visible: boolean;
  onCancel: () => void;
  onEnabled: (salt: string, hash: string) => void;
};

export function PasscodeSetupModal({ visible, onCancel, onEnabled }: Props) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setPin("");
    setConfirm("");
    setError(null);
  };

  useKeydown(
    visible,
    useCallback(
      (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          reset();
          onCancel();
        }
      },
      [onCancel],
    ),
  );

  async function save() {
    if (!isValidPin(pin)) {
      setError("Use 4–6 digits");
      return;
    }
    if (pin !== confirm) {
      setError("Passcodes do not match");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const salt = randomSalt();
      const hash = await hashPasscode(pin, salt);
      onEnabled(salt, hash);
      reset();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={styles.backdrop}
        onPress={() => {
          reset();
          onCancel();
        }}
      >
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Set passcode</Text>
          <Text style={styles.message}>
            Choose a 4–6 digit PIN. You’ll need it each time the app opens.
          </Text>
          <Text style={styles.label}>Passcode</Text>
          <TextInput
            value={pin}
            onChangeText={(t) => setPin(t.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            style={styles.input}
          />
          <Text style={styles.label}>Confirm</Text>
          <TextInput
            value={confirm}
            onChangeText={(t) => setConfirm(t.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Button
              label="Cancel"
              variant="secondary"
              onPress={() => {
                reset();
                onCancel();
              }}
              style={styles.btn}
            />
            <Button
              label={busy ? "Saving…" : "Enable"}
              variant="primary"
              busy={busy}
              onPress={() => void save()}
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
    gap: 8,
  },
  title: { color: colors.accent, fontSize: 17, fontWeight: "700" },
  message: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 4 },
  label: { color: colors.textSecondary, fontSize: 12, fontWeight: "600", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.inputBg,
    fontSize: 18,
    letterSpacing: 4,
  },
  error: { color: colors.danger, fontSize: 13 },
  actions: { flexDirection: "row", gap: 10, marginTop: 10 },
  btn: { flex: 1 },
});
