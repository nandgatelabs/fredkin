import { useCallback, useMemo, useState } from "react";
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
import { reloadAppAsync } from "expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChoiceSheet } from "@/components/ChoiceSheet";
import { ConfirmModal } from "@/components/ConfirmModal";
import { TimePickerModal } from "@/components/DateTimePickers";
import { InfoModal } from "@/components/InfoModal";
import { PasscodeSetupModal } from "@/components/PasscodeSetupModal";
import { PreferenceRow } from "@/components/PreferenceRow";
import { SaveLocationPanel } from "@/components/SaveLocationPanel";
import { useKeydown } from "@/hooks/useKeydown";
import { log } from "@/lib/logger";
import {
  ensureRemindPermission,
  formatRemindTime,
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

/** Full reload so StyleSheets re-read the palette (web mirror / native SQLite). */
async function reloadHomeForTheme() {
  log.info("Reloading app to apply theme");
  if (Platform.OS === "web") {
    // Prefer assign('/') over reload() on /preferences — keeps the initial
    // route simple and avoids expo-router unhandled actions mid-stack.
    window.setTimeout(() => {
      const base = `${window.location.origin}/`;
      window.location.assign(base);
    }, 50);
    return;
  }
  await reloadAppAsync("theme-change");
}

export default function PreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const storedSign = useSettingsStore((s) => s.currencySign);
  const storedPosition = useSettingsStore((s) => s.currencyPosition);
  const storedDecimals = useSettingsStore((s) => s.decimalPlaces);
  const storedNotes = useSettingsStore((s) => s.notesInList);
  const storedTheme = useSettingsStore((s) => s.themeId);
  const storedUi = useSettingsStore((s) => s.uiMode);
  const passcodeEnabled = useSettingsStore((s) => s.passcodeEnabled);
  const remindEveryday = useSettingsStore((s) => s.remindEveryday);
  const remindHour = useSettingsStore((s) => s.remindHour);
  const remindMinute = useSettingsStore((s) => s.remindMinute);
  const recordLogs = useSettingsStore((s) => s.recordLogs);
  const persistAppearance = useSettingsStore((s) => s.persistAppearance);
  const persistPasscode = useSettingsStore((s) => s.persistPasscode);
  const persistRemind = useSettingsStore((s) => s.persistRemind);
  const persistRemindTime = useSettingsStore((s) => s.persistRemindTime);
  const persistRecordLogs = useSettingsStore((s) => s.persistRecordLogs);
  const [remindTimeOpen, setRemindTimeOpen] = useState(false);
  const remindTimeValue = useMemo(() => {
    const d = new Date();
    d.setHours(remindHour, remindMinute, 0, 0);
    return d;
  }, [remindHour, remindMinute]);

  const [themeId, setThemeId] = useState<ThemeId>(storedTheme);
  const [uiMode, setUiMode] = useState<UiMode>(storedUi);
  const [currencySign, setCurrencySign] = useState(storedSign);
  const [currencyPosition, setCurrencyPosition] = useState(storedPosition);
  const [decimalPlaces, setDecimalPlaces] = useState(storedDecimals);
  const [notesInList, setNotesInList] = useState(storedNotes);

  const [sheet, setSheet] = useState<Sheet>(null);
  const [passcodeSetup, setPasscodeSetup] = useState(false);
  const [disablePasscode, setDisablePasscode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const onSave = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const { themeChanged } = await persistAppearance({
        currencySign: currencySign || "₹",
        currencyPosition,
        decimalPlaces: Math.max(0, Math.min(4, decimalPlaces)),
        notesInList,
        themeId,
        uiMode,
      });
      if (themeChanged) {
        setStatus("Saved — applying theme…");
        await reloadHomeForTheme();
        return;
      }
      setStatus("Saved");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }, [
    currencyPosition,
    currencySign,
    decimalPlaces,
    notesInList,
    persistAppearance,
    themeId,
    uiMode,
  ]);

  useKeydown(
    true,
    useCallback(
      (event) => {
        if (event.key === "Escape" && !sheet && !passcodeSetup && !disablePasscode) {
          router.back();
        }
        if (
          (event.key === "s" || event.key === "S") &&
          (event.metaKey || event.ctrlKey) &&
          !sheet
        ) {
          event.preventDefault();
          void onSave();
        }
      },
      [disablePasscode, onSave, passcodeSetup, router, sheet],
    ),
  )

  // Prefer expo config (synced from package.json). Fallback was stuck on pre-1.0 "0.1.0".
  const version =
    Constants.expoConfig?.version ??
    Constants.nativeAppVersion ??
    "1.0.0";

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
        <Text style={styles.title}>Settings</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save settings"
          onPress={() => void onSave()}
          hitSlop={10}
          disabled={busy}
          style={webClickable}
          {...webFocusableProps}
        >
          <Text style={[styles.save, busy && styles.saveBusy]}>
            {busy ? "…" : "SAVE"}
          </Text>
        </Pressable>
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
          onSwitch={setNotesInList}
        />

        <Text style={[styles.section, styles.sectionSpaced]}>Security</Text>
        <PreferenceRow
          label="Passcode protection"
          description="Requires a passcode to enter Fredkin."
          switchValue={passcodeEnabled}
          onSwitch={(v) => {
            if (v) setPasscodeSetup(true);
            else setDisablePasscode(true);
          }}
        />

        <Text style={[styles.section, styles.sectionSpaced]}>Files</Text>
        <SaveLocationPanel />

        <Text style={[styles.section, styles.sectionSpaced]}>Notification</Text>
        <PreferenceRow
          label="Remind everyday"
          description="Remind to add spend occasionally."
          switchValue={remindEveryday}
          onSwitch={(v) => {
            void (async () => {
              if (v) {
                const ok = await ensureRemindPermission();
                if (!ok) {
                  setStatus(
                    Platform.OS === "web"
                      ? "Notification permission blocked — enable it in site settings."
                      : "Notification permission not granted. Enable it in system settings.",
                  );
                  return;
                }
              }
              await persistRemind(v);
              const when = formatRemindTime(remindHour, remindMinute);
              setStatus(
                v
                  ? Platform.OS === "web"
                    ? `Daily remind on — fires at ${when} while this tab is open`
                    : `Daily remind on — every day at ${when} (local time)`
                  : "Daily remind off",
              );
            })();
          }}
        />
        <PreferenceRow
          label="Remind at"
          description={
            Platform.OS === "web"
              ? "Local time. Web only notifies while this tab stays open."
              : "Local time for the OS daily notification."
          }
          valueText={formatRemindTime(remindHour, remindMinute)}
          onPress={() => setRemindTimeOpen(true)}
        />
        <PreferenceRow
          label="Notification settings"
          description={
            Platform.OS === "web"
              ? "Open browser site settings for this page."
              : "Open system notification settings for Fredkin."
          }
          onPress={() => {
            openSystemNotificationSettings();
            setStatus(
              Platform.OS === "web"
                ? "Use the browser lock icon → Site settings to manage notifications."
                : "Open your phone’s Settings → Apps → Fredkin → Notifications.",
            );
          }}
        />

        <Text style={[styles.section, styles.sectionSpaced]}>About</Text>
        <PreferenceRow
          label="Record logs"
          description="Keep a local debug log on this device (default on). Nothing is sent to a server. Export from the menu."
          switchValue={recordLogs}
          onSwitch={(v) => {
            void persistRecordLogs(v).then(() =>
              setStatus(v ? "Log recording on" : "Log recording off"),
            );
          }}
        />
        <PreferenceRow
          label="Privacy"
          description="Local-only storage · no accounts · no cloud sync in v1"
          onPress={() => router.push("/about-doc?kind=privacy" as never)}
        />
        <PreferenceRow
          label="License"
          description="MIT — tap to read"
          onPress={() => router.push("/about-doc?kind=license" as never)}
        />
        <PreferenceRow
          label={`Fredkin : ${version}`}
          description="Fredkin by NandGateLabs · offline personal finance"
        />

        <Text style={styles.hint}>
          Change Appearance options, then press SAVE. Theme / UI mode reloads the app
          once after save so every screen picks up the new colors.
        </Text>
      </ScrollView>

      <InfoModal
        visible={status != null}
        title="Settings"
        message={status ?? ""}
        onClose={() => setStatus(null)}
      />

      <ChoiceSheet
        visible={sheet === "theme"}
        title="Theme"
        options={THEME_OPTIONS.map((t) => ({ id: t.id, label: t.label }))}
        selected={themeId}
        onSelect={setThemeId}
        onClose={() => setSheet(null)}
      />
      <ChoiceSheet
        visible={sheet === "uiMode"}
        title="UI mode"
        options={UI_MODE_OPTIONS.map((t) => ({ id: t.id, label: t.label }))}
        selected={uiMode}
        onSelect={setUiMode}
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
        onSelect={setCurrencySign}
        onClose={() => setSheet(null)}
      />
      <ChoiceSheet
        visible={sheet === "position"}
        title="Currency position"
        options={POSITION_OPTIONS}
        selected={currencyPosition}
        onSelect={setCurrencyPosition}
        onClose={() => setSheet(null)}
      />
      <ChoiceSheet
        visible={sheet === "decimals"}
        title="Decimal places"
        options={DECIMAL_OPTIONS}
        selected={String(decimalPlaces)}
        onSelect={(id) => setDecimalPlaces(Math.max(0, Math.min(4, Number(id))))}
        onClose={() => setSheet(null)}
      />

      <PasscodeSetupModal
        visible={passcodeSetup}
        onCancel={() => setPasscodeSetup(false)}
        onEnabled={(salt, hash) => {
          setPasscodeSetup(false);
          void persistPasscode({ enabled: true, salt, hash }).then(() =>
            setStatus("Passcode enabled"),
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
            setStatus("Passcode disabled"),
          );
        }}
      />

      <TimePickerModal
        visible={remindTimeOpen}
        value={remindTimeValue}
        onCancel={() => setRemindTimeOpen(false)}
        onConfirm={(next) => {
          setRemindTimeOpen(false);
          void persistRemindTime(next.getHours(), next.getMinutes()).then(() =>
            setStatus(
              `Remind time set to ${formatRemindTime(next.getHours(), next.getMinutes())}`,
            ),
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
  save: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 13,
    width: 64,
    textAlign: "right",
  },
  saveBusy: { opacity: 0.5 },
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
  status: {
    color: colors.income,
    marginTop: 20,
    fontWeight: "600",
    fontSize: 13,
    lineHeight: 18,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 12,
  },
});
