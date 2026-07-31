import { useCallback, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useKeydown } from "@/hooks/useKeydown";
import { setSetting } from "@/db/client";
import { webClickable } from "@/lib/web";
import { useSettingsStore } from "@/store/settings";
import { colors } from "@/theme";

export default function PreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currencySign = useSettingsStore((s) => s.currencySign);
  const currencyPosition = useSettingsStore((s) => s.currencyPosition);
  const decimalPlaces = useSettingsStore((s) => s.decimalPlaces);
  const notesInList = useSettingsStore((s) => s.notesInList);
  const hydrate = useSettingsStore((s) => s.hydrate);

  const [sign, setSign] = useState(currencySign);
  const [decimals, setDecimals] = useState(String(decimalPlaces));
  const [notes, setNotes] = useState(notesInList);
  const [position, setPosition] = useState(currencyPosition);
  const [saved, setSaved] = useState(false);

  useKeydown(
    true,
    useCallback(
      (event) => {
        if (event.key === "Escape") router.back();
      },
      [router],
    ),
  );

  async function persist() {
    const d = Math.max(0, Math.min(4, Number(decimals) || 0));
    await Promise.all([
      setSetting("currencySign", JSON.stringify(sign || "₹")),
      setSetting("currencyPosition", JSON.stringify(position)),
      setSetting("decimalPlaces", JSON.stringify(d)),
      setSetting("notesInList", JSON.stringify(notes)),
    ]);
    await hydrate();
    setSaved(true);
  }

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={webClickable}>
          <Text style={styles.back}>✕ CLOSE</Text>
        </Pressable>
        <Text style={styles.title}>Preferences</Text>
        <Pressable onPress={() => void persist()} hitSlop={10} style={webClickable}>
          <Text style={styles.save}>SAVE</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Appearance / money</Text>

      <Text style={styles.label}>Currency sign</Text>
      <TextInput
        value={sign}
        onChangeText={setSign}
        style={styles.input}
        placeholder="₹"
        placeholderTextColor={colors.accentMuted}
      />

      <Text style={styles.label}>Currency position</Text>
      <View style={styles.row}>
        {(["start", "end"] as const).map((p) => (
          <Pressable
            key={p}
            onPress={() => setPosition(p)}
            style={[
              styles.chip,
              webClickable,
              position === p && styles.chipOn,
            ]}
          >
            <Text style={[styles.chipText, position === p && styles.chipTextOn]}>
              {p === "start" ? "Before amount" : "After amount"}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Decimal places (0–4)</Text>
      <TextInput
        value={decimals}
        onChangeText={setDecimals}
        keyboardType="number-pad"
        style={styles.input}
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Show notes in record list</Text>
        <Switch
          value={notes}
          onValueChange={setNotes}
          trackColor={{ false: colors.border, true: colors.accentPressed }}
          thumbColor={notes ? colors.accent : colors.textSecondary}
        />
      </View>

      <Text style={[styles.section, { marginTop: 24 }]}>Security</Text>
      <Text style={styles.hint}>
        Passcode lock ships in a follow-up. Local data stays on this device only.
      </Text>

      <Text style={[styles.section, { marginTop: 24 }]}>About</Text>
      <Text style={styles.hint}>money-money v0.1.0 · MIT · offline-first</Text>

      {saved ? <Text style={styles.saved}>Saved</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  back: { color: colors.accent, fontWeight: "600", fontSize: 13, width: 64 },
  save: { color: colors.accent, fontWeight: "700", fontSize: 13, width: 64, textAlign: "right" },
  title: { color: colors.accent, fontSize: 17, fontWeight: "700" },
  section: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 12,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.inputBg,
    marginBottom: 14,
    fontSize: 16,
  },
  row: { flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.inputBg,
  },
  chipOn: {
    borderColor: colors.accent,
    backgroundColor: "rgba(232, 212, 138, 0.12)",
  },
  chipText: { color: colors.textSecondary, fontWeight: "600", fontSize: 12 },
  chipTextOn: { color: colors.accent },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  switchLabel: { color: colors.text, fontSize: 14, flex: 1, paddingRight: 12 },
  hint: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  saved: { color: colors.income, marginTop: 16, fontWeight: "600" },
});
