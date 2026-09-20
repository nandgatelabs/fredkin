import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { DatePickerModal } from "@/components/DateTimePickers";
import { Button } from "@/components/ui/Button";
import { WebCenterFrame } from "@/components/shell/WebCenterFrame";
import { WebDialogHeader } from "@/components/shell/WebDialogHeader";
import {
  attachRecordsToOccasion,
  createOccasion,
  getOccasion,
  listOccasionsOnDay,
  updateOccasion,
} from "@/db/occasions";
import type { Occasion } from "@/db/types";
import {
  getRecordListItem,
  listUngroupedRecordsInRange,
  type RecordListItem,
} from "@/db/records";
import { useKeydown } from "@/hooks/useKeydown";
import { formatComposerDate, toIsoLocal } from "@/lib/datetime";
import { log } from "@/lib/logger";
import { formatMoney } from "@/lib/money";
import { endOfLocalDay, startOfLocalDay } from "@/lib/occasionsUi";
import { parseOccurredAt } from "@/lib/recordsUi";
import { webClickable } from "@/lib/web";
import { colors } from "@/theme";

export default function OccasionFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    group?: string;
    attachTo?: string;
    recordIds?: string;
  }>();
  const editId = typeof params.id === "string" ? params.id : undefined;
  const attachTo = typeof params.attachTo === "string" ? params.attachTo : undefined;
  const isGroup = params.group === "1" || Boolean(attachTo);
  const seedIds = useMemo(() => {
    const raw = typeof params.recordIds === "string" ? params.recordIds : "";
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }, [params.recordIds]);

  const [title, setTitle] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => new Date());
  const [dateOpen, setDateOpen] = useState(false);
  const [candidates, setCandidates] = useState<RecordListItem[]>([]);
  const [existing, setExisting] = useState<Occasion[]>([]);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(seedIds));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const occId = editId ?? attachTo;
      if (occId) {
        const occ = await getOccasion(occId);
        if (occ && !cancelled) {
          setTitle(occ.title);
          setOccurredAt(parseOccurredAt(occ.occurred_at));
        }
      }
      const seeded: RecordListItem[] = [];
      for (const id of seedIds) {
        const item = await getRecordListItem(id);
        if (item) seeded.push(item);
      }
      if (!cancelled && seeded[0] && !occId) {
        setOccurredAt(parseOccurredAt(seeded[0].occurred_at));
      }
      if (!cancelled) setLoading(false);
    })().catch((e) => {
      if (!cancelled) {
        setError(e instanceof Error ? e.message : "Failed to load");
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [attachTo, editId, seedIds]);

  const loadCandidates = useCallback(async (day: Date) => {
    if (!isGroup) {
      setCandidates([]);
      setExisting([]);
      return;
    }
    const [list, occs] = await Promise.all([
      listUngroupedRecordsInRange(startOfLocalDay(day), endOfLocalDay(day)),
      attachTo ? Promise.resolve([] as Occasion[]) : listOccasionsOnDay(day),
    ]);
    const extra: RecordListItem[] = [];
    for (const id of seedIds) {
      if (list.some((r) => r.id === id)) continue;
      const item = await getRecordListItem(id);
      if (item) extra.push(item);
    }
    setCandidates([...extra, ...list]);
    const dayOccs = occs.filter((o) => o.id !== attachTo);
    setExisting(dayOccs);
    setExistingId((prev) => (prev && dayOccs.some((o) => o.id === prev) ? prev : null));
  }, [attachTo, isGroup, seedIds]);

  useEffect(() => {
    if (loading) return;
    void loadCandidates(occurredAt).catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to list events"),
    );
  }, [loadCandidates, loading, occurredAt]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const persist = useCallback(
    async (andAddEvent: boolean) => {
      const name = title.trim();
      if (!name && !attachTo && !existingId) {
        setError("Pick an occasion on this day, or give a new one a name");
        return;
      }
      try {
        setBusy(true);
        setError(null);
        let occasionId = editId ?? attachTo ?? existingId;
        const asOf = toIsoLocal(occurredAt);
        if (editId) {
          await updateOccasion(editId, { title: name, occurred_at: asOf });
        } else if (!attachTo && !existingId) {
          const occ = await createOccasion({ title: name, occurred_at: asOf });
          occasionId = occ.id;
        }
        if (!occasionId) throw new Error("Occasion not found");
        if (isGroup) {
          await attachRecordsToOccasion(occasionId, [...selected]);
        }
        log.info("Occasion saved", { occasionId, group: isGroup });
        if (andAddEvent) {
          router.replace({
            pathname: "/record/new",
            params: { occasionId },
          });
        } else {
          router.back();
        }
      } catch (e) {
        log.error("Occasion save failed", e);
        setError(e instanceof Error ? e.message : "Save failed");
        setBusy(false);
      }
    },
    [attachTo, editId, existingId, isGroup, occurredAt, router, selected, title],
  );

  useKeydown(
    true,
    useCallback(
      (event) => {
        if (event.key === "Escape" && !dateOpen && !busy) {
          event.preventDefault();
          router.back();
        }
      },
      [busy, dateOpen, router],
    ),
  );

  const heading = editId
    ? "Edit occasion"
    : isGroup
      ? "Group into occasion"
      : "New occasion";

  return (
    <WebCenterFrame>
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 },
        ]}
      >
        {Platform.OS === "web" ? (
          <WebDialogHeader title={heading} escapeBack={!busy && !dateOpen} />
        ) : (
          <View style={styles.nativeHeader}>
            <Pressable
              onPress={() => !busy && router.back()}
              hitSlop={10}
              style={webClickable}
            >
              <Text style={styles.discard}>Discard</Text>
            </Pressable>
            <Text style={styles.nativeTitle}>{heading}</Text>
            <View style={{ width: 64 }} />
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.hint}>
              Optional folder around normal events. Spend and income stay on each line.
            </Text>
            {isGroup && !attachTo && existing.length > 0 ? (
              <>
                <Text style={styles.label}>Occasions on this day</Text>
                {existing.map((occ) => {
                  const on = existingId === occ.id;
                  return (
                    <Pressable
                      key={occ.id}
                      onPress={() => {
                        setExistingId(on ? null : occ.id);
                        setError(null);
                      }}
                      style={[styles.pickRow, webClickable]}
                    >
                      <Ionicons
                        name={on ? "radio-button-on" : "radio-button-off"}
                        size={22}
                        color={on ? colors.accent : colors.textSecondary}
                      />
                      <Text style={styles.pickTitle}>{occ.title}</Text>
                    </Pressable>
                  );
                })}
                <Text style={styles.label}>
                  {existingId ? "Or create a new occasion instead" : "Or create new"}
                </Text>
              </>
            ) : null}
            {attachTo || existingId ? null : (
              <>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={(t) => {
                    setTitle(t);
                    if (t.trim()) setExistingId(null);
                  }}
                  placeholder="Outing, trip, dinner…"
                  placeholderTextColor={colors.textSecondary}
                />
                <Text style={styles.label}>Date</Text>
                <Pressable
                  onPress={() => setDateOpen(true)}
                  style={[styles.dateBtn, webClickable]}
                >
                  <Text style={styles.dateText}>{formatComposerDate(occurredAt)}</Text>
                </Pressable>
              </>
            )}

            {isGroup ? (
              <>
                <Text style={styles.label}>Events to include</Text>
                {candidates.length === 0 ? (
                  <Text style={styles.empty}>No ungrouped events on this day.</Text>
                ) : (
                  candidates.map((item) => {
                    const on = selected.has(item.id);
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => toggle(item.id)}
                        style={[styles.pickRow, webClickable]}
                      >
                        <Ionicons
                          name={on ? "checkbox" : "square-outline"}
                          size={22}
                          color={on ? colors.accent : colors.textSecondary}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.pickTitle} numberOfLines={1}>
                            {item.category_name ?? item.type}
                          </Text>
                          <Text style={styles.pickMeta} numberOfLines={1}>
                            {item.account_name}
                            {item.note.trim() ? ` · ${item.note.trim()}` : ""}
                          </Text>
                        </View>
                        <Text style={styles.pickAmt}>
                          {formatMoney(item.amount, { sign: "never" })}
                        </Text>
                      </Pressable>
                    );
                  })
                )}
              </>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {isGroup ? (
              <Button
                label="SAVE GROUP"
                variant="primary"
                disabled={busy || selected.size === 0 || (!attachTo && !existingId && !title.trim())}
                busy={busy}
                onPress={() => void persist(false)}
              />
            ) : (
              <>
                {editId ? (
                  <Button
                    label="SAVE"
                    variant="primary"
                    disabled={busy}
                    busy={busy}
                    onPress={() => void persist(false)}
                  />
                ) : (
                  <>
                    <Button
                      label="SAVE AND ADD EVENT"
                      variant="primary"
                      disabled={busy}
                      busy={busy}
                      onPress={() => void persist(true)}
                    />
                    <Button
                      label="SAVE FOLDER ONLY"
                      variant="secondary"
                      disabled={busy}
                      onPress={() => void persist(false)}
                    />
                  </>
                )}
              </>
            )}
          </ScrollView>
        )}

        <DatePickerModal
          visible={dateOpen}
          value={occurredAt}
          onCancel={() => setDateOpen(false)}
          onConfirm={(d) => {
            setOccurredAt(d);
            setDateOpen(false);
          }}
        />
      </View>
    </WebCenterFrame>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  nativeHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  discard: { color: colors.accent, fontWeight: "600", width: 64 },
  nativeTitle: {
    flex: 1,
    textAlign: "center",
    color: colors.accent,
    fontSize: 16,
    fontWeight: "700",
  },
  body: { paddingHorizontal: 20, paddingBottom: 24, gap: 10 },
  hint: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 6 },
  label: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
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
  dateBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  dateText: { color: colors.accent, fontWeight: "600" },
  empty: { color: colors.textSecondary, fontSize: 13 },
  pickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  pickTitle: { color: colors.text, fontWeight: "600" },
  pickMeta: { color: colors.textSecondary, fontSize: 12 },
  pickAmt: { color: colors.text, fontWeight: "700" },
  error: { color: colors.danger, fontSize: 13 },
});
