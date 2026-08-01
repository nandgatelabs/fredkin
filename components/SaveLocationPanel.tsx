import { useCallback, useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { InfoModal } from "@/components/InfoModal";
import {
  canPickWebSaveFolder,
  getSaveLocation,
  pickSaveLocation,
  restoreDefaultSaveLocation,
  type SaveLocationInfo,
} from "@/lib/saveLocation";
import { log } from "@/lib/logger";
import { webClickable } from "@/lib/web";
import { colors } from "@/theme";

type Props = {
  onStatus?: (message: string) => void;
};

export function SaveLocationPanel({ onStatus }: Props) {
  const [loc, setLoc] = useState<SaveLocationInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoc(await getSaveLocation());
    } catch (e) {
      log.warn("getSaveLocation failed", e);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const notify = (message: string) => {
    setInfo(message);
    onStatus?.(message);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Save location</Text>
      <Text style={styles.body}>
        CSV exports and backups are written to a{" "}
        <Text style={styles.em}>fredkin</Text> folder by default.
      </Text>
      <Text style={styles.path} selectable>
        {loc?.label ?? "…"}
      </Text>
      {Platform.OS === "web" && !canPickWebSaveFolder() ? (
        <Text style={styles.note}>
          Folder picker unavailable in this browser — exports use Downloads. Use
          Chrome/Edge, or enable File System Access in Brave flags.
        </Text>
      ) : null}
      <View style={styles.row}>
        <Pressable
          disabled={busy}
          style={[styles.btn, webClickable, busy && styles.disabled]}
          onPress={() => {
            void (async () => {
              setBusy(true);
              try {
                const next = await pickSaveLocation();
                setLoc(next);
                notify(`Save folder set to ${next.label}`);
              } catch (e) {
                const msg = e instanceof Error ? e.message : "Could not change folder";
                if (!/cancel/i.test(msg)) notify(msg);
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          <Text style={styles.btnLabel}>Change folder</Text>
        </Pressable>
        <Pressable
          disabled={busy || loc?.isDefault}
          style={[
            styles.btn,
            styles.btnGhost,
            webClickable,
            (busy || loc?.isDefault) && styles.disabled,
          ]}
          onPress={() => {
            void (async () => {
              setBusy(true);
              try {
                const next = await restoreDefaultSaveLocation();
                setLoc(next);
                notify("Restored default save folder");
              } catch (e) {
                notify(e instanceof Error ? e.message : "Restore failed");
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          <Text style={styles.btnGhostLabel}>Restore default</Text>
        </Pressable>
      </View>

      <InfoModal
        visible={info != null}
        title="Save location"
        message={info ?? ""}
        onClose={() => setInfo(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    backgroundColor: colors.surface,
    gap: 8,
  },
  title: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "700",
  },
  body: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  em: { color: colors.accent, fontWeight: "600" },
  path: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  note: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: "italic",
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  btn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnLabel: { color: colors.onAccent, fontWeight: "700", fontSize: 13 },
  btnGhostLabel: { color: colors.accent, fontWeight: "600", fontSize: 13 },
  disabled: { opacity: 0.45 },
});
