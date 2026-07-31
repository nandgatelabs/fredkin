import { useCallback, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChoiceSheet } from "@/components/ChoiceSheet";
import { ConfirmModal } from "@/components/ConfirmModal";
import { PasscodeSetupModal } from "@/components/PasscodeSetupModal";
import { PreferenceRow } from "@/components/PreferenceRow";
import { useKeydown } from "@/hooks/useKeydown";
import {
  ensureRemindPermission,
  openSystemNotificationSettings,
} from "@/lib/remind";
import { webClickable, webFocusableProps } from "@/lib/web";
import { useSettingsStore } from "@/store/settings";
import { colors } from "@/theme";
import {
  THEME_OPTIONS,
  UI_MODE_OPTIONS,
  type ThemeId,
  type UiMode,
} from "@/theme/palettes";

const CURRENCY_OPTIONS = [
  { id: "₹", label: "Indian Rupee — ₹", description: "INR" },
  { id: "$", label: "US Dollar — $", description: "USD" },
  { id: "€", label: "Euro — €", description: "EUR" },
  { id: "£", label: "Pound — £", description: "GBP" },
  { id: "¥", label: "Yen — ¥", description: "JPY" },
] as const;

const POSITION_OPTIONS = [
  { id: "start" as const, label: "At start of amount", description: "₹1,234.00" },
  { id: "end" as const, label: "At end of amount", description: "1,234.00₹" },
];

const DECIMAL_OPTIONS = [0, 1, 2, 3, 4].map((n) => ({
  id: String(n),
  label: `${n}${n === 2 ? " (eg. 10.45)" : n === 0 ? " (eg. 10)" : ""}`,
}));

type Sheet =
  | "theme"
  | "uiMode"
  | "currency"
  | "position"
  | "decimals"
  | null;

export default function PreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const currencySign = useSettingsStore((s) => s.currencySign);
  const currencyPosition = useSettingsStore((s) => s.currencyPosition);
  const decimalPlaces = useSettingsStore((s) => s.decimalPlaces);
  const notesInList = useSettingsStore((s) => s.notesInList);
  const themeId = useSettingsStore((s) => s.themeId);
  const uiMode = useSettingsStore((s) => s.uiMode);
  const passcodeEnabled = useSettingsStore((s) => s.passcodeEnabled);
  const remindEveryday = useSettingsStore((s) => s.remindEveryday);
  const crashStats = useSettingsStore((s) => s.crashStats);
  const persistAppearance = useSettingsStore((s) => s.persistAppearance);
  const persistPasscode = useSettingsStore((s) => s.persistPasscode);
  const persistRemind = useSettingsStore((s) => s.persistRemind);
  const persistCrashStats = useSettingsStore((s) => s.persistCrashStats);

  const [sheet, setSheet] = useState<Sheet>(null);
  const [passcodeSetup, setPasscodeSetup] = useState(false);
  const [disablePasscode, setDisablePasscode] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  useKeydown(
    true,
    useCallback(
      (event) => {
        if (event.key === "Escape" && !sheet && !passcodeSetup && !disablePasscode) {
          router.back();
        }
      },
      [disablePasscode, passcodeSetup, router, sheet],
    ),
  );

  async function saveAppearance(patch: {
    currencySign?: string;
    currencyPosition?: "start" | "end";
    decimalPlaces?: number;
    notesInList?: boolean;
    themeId?: ThemeId;
    uiMode?: UiMode;
  }) {
    const next = {
      currencySign: patch.currencySign ?? currencySign,
      currencyPosition: patch.currencyPosition ?? currencyPosition,
      decimalPlaces: patch.decimalPlaces ?? decimalPlaces,
      notesInList: patch.notesInList ?? notesInList,
      themeId: patch.themeId ?? themeId,
      uiMode: patch.uiMode ?? uiMode,
    };
    const { themeChanged } = await persistAppearance(next);
    if (themeChanged) {
      setSavedNote("Theme applied — reloading…");
      if (Platform.OS === "web") {
        window.setTimeout(() => window.location.reload(), 350);
      } else {
        setSavedNote("Theme saved. Restart the app to refresh all screens.");
      }
    } else {
      setSavedNote("Saved");
    }
  }

  const version =
    Constants.expoConfig?.version ??
    Constants.nativeAppVersion ??
    "0.1.0";

  const themeLabel =
    THEME_OPTIONS.find((t) => t.id === themeId)?.label ?? "Original";
  const uiLabel =
    UI_MODE_OPTIONS.find((t) => t.id === uiMode)?.label ?? "Dark";
  const currencyLabel =
    CURRENCY_OPTIONS.find((c) => c.id === currencySign)?.label ?? currencySign;
  const positionLabel =
    POSITION_OPTIONS.find((p) => p.id === currencyPosition)?.label ??
    "At start of amount";

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 8 },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          hitSlop={10}
          style={webClickable}
          {...webFocusableProps}
        >
          <Text style={styles.back}>✕ CLOSE</Text>
        </Pressable>
        <Text style={styles.title}>Preferences</Text>
        <View style={{ width: 64 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>Appearance</Text>
        <PreferenceRow
          label="Theme"
          valueText={themeLabel}
          onPress={() => setSheet("theme")}
        />
        <PreferenceRow
          label="UI mode"
          valueText={uiLabel}
          onPress={() => setSheet("uiMode")}
        />
        <PreferenceRow
          label="Currency sign"
          valueText={currencyLabel}
          onPress={() => setSheet("currency")}
        />
        <PreferenceRow
          label="Currency position"
          valueText={positionLabel}
          onPress={() => setSheet("position")}
        />
        <PreferenceRow
          label="Decimal places"
          valueText={`${decimalPlaces}${decimalPlaces === 2 ? " (eg. 10.45)" : ""}`}
          onPress={() => setSheet("decimals")}
        />
        <PreferenceRow
          label="Notes in record list"
          description="Preview notes where space allows."
          switchValue={notesInList}
          onSwitch={(v) => void saveAppearance({ notesInList: v })}
        />

        <Text style={[styles.section, styles.sectionSpaced]}>Security</Text>
        <PreferenceRow
          label="Passcode protection"
          description="Requires a passcode to enter money-money."
          switchValue={passcodeEnabled}
          onSwitch={(v) => {
            if (v) setPasscodeSetup(true);
            else setDisablePasscode(true);
          }}
        />

        <Text style={[styles.section, styles.sectionSpaced]}>Notification</Text>
        <PreferenceRow
          label="Remind everyday"
          description="Remind to add expenses occasionally."
          switchValue={remindEveryday}
          onSwitch={(v) => {
            void (async () => {
              if (v) {
                const ok = await ensureRemindPermission();
                if (!ok && Platform.OS === "web") {
                  setSavedNote(
                    "Notification permission blocked — enable it in site settings.",
                  );
                }
              }
              await persistRemind(v);
              setSavedNote(v ? "Daily remind on" : "Daily remind off");
            })();
          }}
        />
        <PreferenceRow
          label="Notification settings"
          onPress={() => openSystemNotificationSettings()}
        />

        <Text style={[styles.section, styles.sectionSpaced]}>About</Text>
        <PreferenceRow
          label="Send crash and usage statistics"
          description="Off by default. No telemetry is sent in v1."
          switchValue={crashStats}
          onSwitch={(v) => {
            void persistCrashStats(v).then(() =>
              setSavedNote(v ? "Stats preference saved (no data sent yet)" : "Stats off"),
            );
          }}
        />
        <PreferenceRow
          label="Privacy"
          description="All ledger data stays on this device. MIT licensed."
          onPress={() =>
            setSavedNote("Privacy: local-only storage · no accounts · no cloud sync in v1")
          }
        />
        <PreferenceRow
          label={`money-money : ${version}`}
          description="Offline personal finance · nandgatelabs"
        />

        {savedNote ? <Text style={styles.saved}>{savedNote}</Text> : null}
      </ScrollView>

      <ChoiceSheet
        visible={sheet === "theme"}
        title="Theme"
        options={THEME_OPTIONS.map((t) => ({ id: t.id, label: t.label }))}
        selected={themeId}
        onSelect={(id) => void saveAppearance({ themeId: id })}
        onClose={() => setSheet(null)}
      />
      <ChoiceSheet
        visible={sheet === "uiMode"}
        title="UI mode"
        options={UI_MODE_OPTIONS.map((t) => ({ id: t.id, label: t.label }))}
        selected={uiMode}
        onSelect={(id) => void saveAppearance({ uiMode: id })}
        onClose={() => setSheet(null)}
      />
      <ChoiceSheet
        visible={sheet === "currency"}
        title="Currency sign"
        options={CURRENCY_OPTIONS.map((c) => ({
          id: c.id,
          label: c.label,
          description: c.description,
        }))}
        selected={
          CURRENCY_OPTIONS.some((c) => c.id === currencySign) ? currencySign : "₹"
        }
        onSelect={(id) => void saveAppearance({ currencySign: id })}
        onClose={() => setSheet(null)}
      />
      <ChoiceSheet
        visible={sheet === "position"}
        title="Currency position"
        options={POSITION_OPTIONS}
        selected={currencyPosition}
        onSelect={(id) => void saveAppearance({ currencyPosition: id })}
        onClose={() => setSheet(null)}
      />
      <ChoiceSheet
        visible={sheet === "decimals"}
        title="Decimal places"
        options={DECIMAL_OPTIONS}
        selected={String(decimalPlaces)}
        onSelect={(id) =>
          void saveAppearance({ decimalPlaces: Math.max(0, Math.min(4, Number(id))) })
        }
        onClose={() => setSheet(null)}
      />

      <PasscodeSetupModal
        visible={passcodeSetup}
        onCancel={() => setPasscodeSetup(false)}
        onEnabled={(salt, hash) => {
          setPasscodeSetup(false);
          void persistPasscode({ enabled: true, salt, hash }).then(() =>
            setSavedNote("Passcode enabled"),
          );
        }}
      />

      <ConfirmModal
        visible={disablePasscode}
        title="Turn off passcode?"
        message="The app will open without asking for a PIN."
        confirmLabel="Turn off"
        destructive
        onCancel={() => setDisablePasscode(false)}
        onConfirm={() => {
          setDisablePasscode(false);
          void persistPasscode({ enabled: false, salt: "", hash: "" }).then(() =>
            setSavedNote("Passcode disabled"),
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  back: { color: colors.accent, fontWeight: "600", fontSize: 13, width: 64 },
  title: { color: colors.accent, fontSize: 17, fontWeight: "700" },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 4,
    marginTop: 8,
  },
  sectionSpaced: { marginTop: 28 },
  saved: {
    color: colors.income,
    marginTop: 20,
    fontWeight: "600",
    fontSize: 13,
    lineHeight: 18,
  },
});
