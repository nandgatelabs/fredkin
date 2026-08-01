import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useKeydown } from "@/hooks/useKeydown";
import { isValidPin, verifyPasscode } from "@/lib/passcode";
import { webClickable, webFocusableProps } from "@/lib/web";
import { useSettingsStore } from "@/store/settings";
import { colors } from "@/theme";

type Props = {
  onUnlocked: () => void;
};

export function PasscodeGate({ onUnlocked }: Props) {
  const insets = useSafeAreaInsets();
  const salt = useSettingsStore((s) => s.passcodeSalt);
  const hash = useSettingsStore((s) => s.passcodeHash);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = useCallback(async () => {
    if (!isValidPin(pin)) {
      setError("Enter a 4–6 digit passcode");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const ok = await verifyPasscode(pin, salt, hash);
      if (!ok) {
        setError("Incorrect passcode");
        setPin("");
        return;
      }
      onUnlocked();
    } finally {
      setBusy(false);
    }
  }, [hash, onUnlocked, pin, salt]);

  useKeydown(
    true,
    useCallback(
      (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          void submit();
        }
      },
      [submit],
    ),
  );

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Text style={styles.brand}>Fredkin</Text>
      <Text style={styles.title}>Enter passcode</Text>
      <Text style={styles.hint}>Unlock to open your local ledger</Text>

      <TextInput
        value={pin}
        onChangeText={(t) => {
          setPin(t.replace(/\D/g, "").slice(0, 6));
          setError(null);
        }}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        autoFocus
        style={styles.input}
        accessibilityLabel="Passcode"
        onSubmitEditing={() => void submit()}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Unlock"
        disabled={busy}
        onPress={() => void submit()}
        {...webFocusableProps}
        style={({ pressed }) => [
          styles.btn,
          webClickable,
          pressed && styles.btnPressed,
          busy && styles.btnDisabled,
        ]}
      >
        <Text style={styles.btnLabel}>{busy ? "CHECKING…" : "UNLOCK"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  brand: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: "600",
    fontStyle: "italic",
    marginBottom: 28,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 28,
    textAlign: "center",
  },
  input: {
    width: "100%",
    maxWidth: 280,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    backgroundColor: colors.inputBg,
    fontSize: 22,
    letterSpacing: 8,
    textAlign: "center",
    marginBottom: 12,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 8,
  },
  btn: {
    marginTop: 12,
    minHeight: 46,
    minWidth: 200,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  btnPressed: { opacity: 0.9 },
  btnDisabled: { opacity: 0.5 },
  btnLabel: {
    color: colors.onAccent,
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
