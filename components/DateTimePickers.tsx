import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/ui/Button";
import { useKeydown } from "@/hooks/useKeydown";
import { useThemeColors } from "@/hooks/useThemeColors";
import { setDatePart, setTimePart } from "@/lib/datetime";
import type { ColorTokens } from "@/theme/palettes";
import { layout } from "@/theme/layout";

type DateProps = {
  visible: boolean;
  value: Date;
  onCancel: () => void;
  onConfirm: (next: Date) => void;
};

export function DatePickerModal({ visible, value, onCancel, onConfirm }: DateProps) {
  const c = useThemeColors();
  const [year, setYear] = useState(value.getFullYear());
  const [month, setMonth] = useState(value.getMonth());
  const [day, setDay] = useState(value.getDate());

  useEffect(() => {
    if (!visible) return;
    setYear(value.getFullYear());
    setMonth(value.getMonth());
    setDay(value.getDate());
  }, [visible, value]);

  const daysInMonth = useMemo(
    () => new Date(year, month + 1, 0).getDate(),
    [year, month],
  );

  useEffect(() => {
    if (day > daysInMonth) setDay(daysInMonth);
  }, [day, daysInMonth]);

  const years = useMemo(() => {
    const y = value.getFullYear();
    return Array.from({ length: 11 }, (_, i) => y - 5 + i);
  }, [value]);

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
          onConfirm(setDatePart(value, year, month, day));
        }
      },
      [day, month, onCancel, onConfirm, value, visible, year],
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
          <Text style={[styles.title, { color: c.accent }]}>Pick a date</Text>
          <View style={styles.columns}>
            <Wheel
              label="Month"
              values={MONTH_LABELS}
              selectedIndex={month}
              onChange={setMonth}
              colors={c}
            />
            <Wheel
              label="Day"
              values={Array.from({ length: daysInMonth }, (_, i) => String(i + 1))}
              selectedIndex={day - 1}
              onChange={(i) => setDay(i + 1)}
              colors={c}
            />
            <Wheel
              label="Year"
              values={years.map(String)}
              selectedIndex={Math.max(0, years.indexOf(year))}
              onChange={(i) => setYear(years[i])}
              colors={c}
            />
          </View>
          <View style={styles.actions}>
            <Button label="CANCEL" variant="ghost" onPress={onCancel} style={styles.actionBtn} />
            <Button
              label="OK"
              variant="primary"
              onPress={() => onConfirm(setDatePart(value, year, month, day))}
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
          <View style={styles.columns}>
            <Wheel
              label="Hour"
              values={Array.from({ length: 12 }, (_, i) => String(i + 1))}
              selectedIndex={hour12 - 1}
              onChange={(i) => setHour12(i + 1)}
              colors={c}
            />
            <Wheel
              label="Min"
              values={Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"))}
              selectedIndex={minute}
              onChange={setMinute}
              colors={c}
            />
            <Wheel
              label="AM/PM"
              values={["AM", "PM"]}
              selectedIndex={ampm === "AM" ? 0 : 1}
              onChange={(i) => setAmpm(i === 0 ? "AM" : "PM")}
              colors={c}
            />
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

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function splitTime(d: Date) {
  const h24 = d.getHours();
  const ampm: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  let hour12 = h24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute: d.getMinutes(), ampm };
}

function Wheel({
  label,
  values,
  selectedIndex,
  onChange,
  colors: c,
}: {
  label: string;
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  colors: ColorTokens;
}) {
  return (
    <View style={styles.wheel}>
      <Text style={[styles.wheelLabel, { color: c.textSecondary }]}>{label}</Text>
      <ScrollView
        style={[styles.wheelScroll, { backgroundColor: c.inputBg }]}
        showsVerticalScrollIndicator={false}
      >
        {values.map((v, i) => (
          <Pressable key={`${label}-${v}`} onPress={() => onChange(i)}>
            <Text
              style={[
                styles.wheelItem,
                { color: i === selectedIndex ? c.accent : c.textSecondary },
                i === selectedIndex && styles.wheelItemOn,
              ]}
            >
              {v}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
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
  columns: {
    flexDirection: "row",
    gap: 8,
    height: 180,
  },
  wheel: {
    flex: 1,
  },
  wheelLabel: {
    fontSize: 11,
    textAlign: "center",
    marginBottom: 4,
  },
  wheelScroll: {
    flex: 1,
    borderRadius: 8,
  },
  wheelItem: {
    textAlign: "center",
    paddingVertical: 8,
    fontSize: 15,
  },
  wheelItemOn: {
    fontWeight: "700",
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
