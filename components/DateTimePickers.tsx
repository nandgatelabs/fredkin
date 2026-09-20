import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/components/ui/Button";
import { useKeydown } from "@/hooks/useKeydown";
import { useThemeColors } from "@/hooks/useThemeColors";
import { setDatePart, setTimePart } from "@/lib/datetime";
import { webClickable } from "@/lib/web";
import { layout } from "@/theme/layout";

type DateProps = {
  visible: boolean;
  value: Date;
  onCancel: () => void;
  onConfirm: (next: Date) => void;
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function monthCells(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const n = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i += 1) cells.push(null);
  for (let d = 1; d <= n; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function DatePickerModal({ visible, value, onCancel, onConfirm }: DateProps) {
  const c = useThemeColors();
  const [year, setYear] = useState(value.getFullYear());
  const [month, setMonth] = useState(value.getMonth());
  const [day, setDay] = useState(value.getDate());
  const [pickingYear, setPickingYear] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setYear(value.getFullYear());
    setMonth(value.getMonth());
    setDay(value.getDate());
    setPickingYear(false);
  }, [visible, value]);

  const daysInMonth = useMemo(
    () => new Date(year, month + 1, 0).getDate(),
    [year, month],
  );

  useEffect(() => {
    if (day > daysInMonth) setDay(daysInMonth);
  }, [day, daysInMonth]);

  const cells = useMemo(() => monthCells(year, month), [year, month]);
  const now = new Date();
  const years = useMemo(() => {
    const end = Math.max(new Date().getFullYear() + 1, value.getFullYear());
    return Array.from({ length: end - 1999 }, (_, i) => end - i);
  }, [value]);

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  const commit = useCallback(
    (y: number, m: number, d: number) => {
      onConfirm(setDatePart(value, y, m, d));
    },
    [onConfirm, value],
  );

  useKeydown(
    visible,
    useCallback(
      (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
        if (event.key === "Enter" && !pickingYear) {
          event.preventDefault();
          commit(year, month, day);
        }
      },
      [commit, day, month, onCancel, pickingYear, year],
    ),
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: c.overlay }]}
        onPress={onCancel}
      >
        <Pressable
          style={[
            styles.card,
            { backgroundColor: c.dialog, borderColor: c.border },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.calHeader}>
            <Pressable
              onPress={() => shiftMonth(-1)}
              hitSlop={10}
              accessibilityLabel="Previous month"
              style={[styles.calNav, webClickable]}
            >
              <Ionicons name="chevron-back" size={22} color={c.accent} />
            </Pressable>
            <Pressable
              onPress={() => setPickingYear((v) => !v)}
              accessibilityLabel="Choose year"
              style={[styles.calTitleBtn, webClickable]}
            >
              <Text style={[styles.title, { color: c.accent, marginBottom: 0 }]}>
                {MONTH_NAMES[month]} {year}
              </Text>
              <Ionicons
                name={pickingYear ? "chevron-up" : "chevron-down"}
                size={16}
                color={c.accent}
              />
            </Pressable>
            <Pressable
              onPress={() => shiftMonth(1)}
              hitSlop={10}
              accessibilityLabel="Next month"
              style={[styles.calNav, webClickable]}
            >
              <Ionicons name="chevron-forward" size={22} color={c.accent} />
            </Pressable>
          </View>

          {pickingYear ? (
            <ScrollView style={styles.yearScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.yearGrid}>
                {years.map((y) => {
                  const on = y === year;
                  return (
                    <Pressable
                      key={y}
                      onPress={() => {
                        setYear(y);
                        setPickingYear(false);
                      }}
                      style={[
                        styles.yearCell,
                        {
                          backgroundColor: on ? c.accent : c.inputBg,
                          borderColor: c.border,
                        },
                        webClickable,
                      ]}
                    >
                      <Text style={{ color: on ? c.onAccent : c.text, fontWeight: "600" }}>
                        {y}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          ) : (
            <>
              <View style={styles.weekRow}>
                {WEEKDAYS.map((w, i) => (
                  <Text
                    key={`${w}-${i}`}
                    style={[styles.weekLabel, { color: c.textSecondary }]}
                  >
                    {w}
                  </Text>
                ))}
              </View>
              <View style={styles.dayGrid}>
                {cells.map((d, i) => {
                  if (d == null) {
                    return <View key={`e-${i}`} style={styles.dayCell} />;
                  }
                  const selected = d === day;
                  const isToday =
                    year === now.getFullYear() &&
                    month === now.getMonth() &&
                    d === now.getDate();
                  return (
                    <Pressable
                      key={`d-${year}-${month}-${d}`}
                      onPress={() => {
                        setDay(d);
                        commit(year, month, d);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${MONTH_NAMES[month]} ${d}, ${year}`}
                      style={[
                        styles.dayCell,
                        selected && { backgroundColor: c.accent },
                        !selected && isToday && { borderColor: c.accent, borderWidth: 1 },
                        webClickable,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNum,
                          { color: selected ? c.onAccent : c.text },
                          isToday && !selected && { color: c.accent, fontWeight: "700" },
                        ]}
                      >
                        {d}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <View style={styles.actions}>
            <Button label="CANCEL" variant="ghost" onPress={onCancel} style={styles.actionBtn} />
            <Button
              label="TODAY"
              variant="secondary"
              onPress={() => {
                const t = new Date();
                commit(t.getFullYear(), t.getMonth(), t.getDate());
              }}
              style={styles.actionBtn}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type TimeProps = {
  visible: boolean;
  value: Date;
  onCancel: () => void;
  onConfirm: (next: Date) => void;
};

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTE_CHIPS = [0, 15, 30, 45];

export function TimePickerModal({ visible, value, onCancel, onConfirm }: TimeProps) {
  const c = useThemeColors();
  const initial = useMemo(() => splitTime(value), [value]);
  const [hour12, setHour12] = useState(initial.hour12);
  const [minute, setMinute] = useState(initial.minute);
  const [ampm, setAmpm] = useState<"AM" | "PM">(initial.ampm);

  useEffect(() => {
    if (!visible) return;
    const t = splitTime(value);
    setHour12(t.hour12);
    setMinute(t.minute);
    setAmpm(t.ampm);
  }, [visible, value]);

  const confirm = useCallback(() => {
    let h = hour12 % 12;
    if (ampm === "PM") h += 12;
    onConfirm(setTimePart(value, h, minute));
  }, [ampm, hour12, minute, onConfirm, value]);

  useKeydown(
    visible,
    useCallback(
      (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
        if (event.key === "Enter") {
          event.preventDefault();
          confirm();
        }
      },
      [confirm, onCancel],
    ),
  );

  const bumpMinute = (delta: number) => {
    setMinute((m) => {
      const next = m + delta;
      if (next < 0) return 59;
      if (next > 59) return 0;
      return next;
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: c.overlay }]}
        onPress={onCancel}
      >
        <Pressable
          style={[
            styles.card,
            { backgroundColor: c.dialog, borderColor: c.border },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: c.accent }]}>Pick a time</Text>
          <Text style={[styles.timePreview, { color: c.text }]}>
            {hour12}:{minute.toString().padStart(2, "0")} {ampm}
          </Text>

          <View style={styles.ampmRow}>
            {(["AM", "PM"] as const).map((p) => {
              const on = ampm === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => setAmpm(p)}
                  style={[
                    styles.ampmBtn,
                    {
                      backgroundColor: on ? c.accent : c.inputBg,
                      borderColor: c.border,
                    },
                    webClickable,
                  ]}
                >
                  <Text style={{ color: on ? c.onAccent : c.text, fontWeight: "700" }}>
                    {p}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>Hour</Text>
          <View style={styles.hourGrid}>
            {HOURS.map((h) => {
              const on = hour12 === h;
              return (
                <Pressable
                  key={h}
                  onPress={() => setHour12(h)}
                  style={[
                    styles.hourCell,
                    {
                      backgroundColor: on ? c.accent : c.inputBg,
                      borderColor: c.border,
                    },
                    webClickable,
                  ]}
                >
                  <Text style={{ color: on ? c.onAccent : c.text, fontWeight: "600" }}>
                    {h}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>Minute</Text>
          <View style={styles.minRow}>
            <Pressable
              onPress={() => bumpMinute(-1)}
              style={[styles.minStep, { borderColor: c.border, backgroundColor: c.inputBg }, webClickable]}
              accessibilityLabel="Minute down"
            >
              <Ionicons name="remove" size={20} color={c.accent} />
            </Pressable>
            <Text style={[styles.minValue, { color: c.text }]}>
              {minute.toString().padStart(2, "0")}
            </Text>
            <Pressable
              onPress={() => bumpMinute(1)}
              style={[styles.minStep, { borderColor: c.border, backgroundColor: c.inputBg }, webClickable]}
              accessibilityLabel="Minute up"
            >
              <Ionicons name="add" size={20} color={c.accent} />
            </Pressable>
          </View>
          <View style={styles.chipRow}>
            {MINUTE_CHIPS.map((m) => {
              const on = minute === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMinute(m)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: on ? c.accent : c.inputBg,
                      borderColor: c.border,
                    },
                    webClickable,
                  ]}
                >
                  <Text style={{ color: on ? c.onAccent : c.textSecondary, fontWeight: "600" }}>
                    :{m.toString().padStart(2, "0")}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actions}>
            <Button label="CANCEL" variant="ghost" onPress={onCancel} style={styles.actionBtn} />
            <Button label="OK" variant="primary" onPress={confirm} style={styles.actionBtn} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function splitTime(d: Date) {
  const h24 = d.getHours();
  const ampm: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  let hour12 = h24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute: d.getMinutes(), ampm };
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    width: "100%",
    maxWidth: layout.dialogMaxWidth,
    alignSelf: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  calNav: {
    padding: 6,
  },
  calTitleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
  },
  dayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  dayNum: {
    fontSize: 14,
    fontWeight: "500",
  },
  yearScroll: {
    maxHeight: 280,
  },
  yearGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  yearCell: {
    width: "30%",
    flexGrow: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  timePreview: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  ampmRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  ampmBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  hourGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  hourCell: {
    width: "25%",
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 6,
    borderRadius: 10,
  },
  minRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 8,
  },
  minStep: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  minValue: {
    fontSize: 24,
    fontWeight: "700",
    minWidth: 48,
    textAlign: "center",
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
  },
});
