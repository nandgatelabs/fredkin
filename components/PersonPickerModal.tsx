import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GhostButton } from "@/components/GhostButton";
import type { Person } from "@/db/types";
import { useThemeColors } from "@/hooks/useThemeColors";
import { personRoleLabel, type PersonRole } from "@/lib/personRole";
import { webClickable } from "@/lib/web";

type Props = {
  visible: boolean;
  people: Person[];
  selectedId?: string | null;
  roles: PersonRole[];
  personRole: PersonRole;
  onRoleChange: (role: PersonRole) => void;
  onClose: () => void;
  onSelect: (person: Person | null) => void;
  onAddNew: () => void;
};

export function PersonPickerModal({
  visible,
  people,
  selectedId,
  roles,
  personRole,
  onRoleChange,
  onClose,
  onSelect,
  onAddNew,
}: Props) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const isWeb = Platform.OS === "web";

  const sheet = (
    <Pressable
      style={[styles.backdrop, isWeb && styles.backdropCentered]}
      onPress={onClose}
    >
      <Pressable
        style={[
          isWeb ? styles.webCard : styles.sheet,
          { backgroundColor: c.dialog, borderColor: c.border },
          !isWeb && { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
        onPress={(e) => e.stopPropagation()}
      >
        <Text style={[styles.title, { color: c.accent }]}>Person</Text>
        <ScrollView showsVerticalScrollIndicator={false} style={isWeb ? styles.webScroll : undefined}>
          <Pressable
            onPress={() => onSelect(null)}
            style={[styles.row, webClickable]}
          >
            <Ionicons
              name={selectedId == null ? "checkmark-circle" : "ellipse-outline"}
              size={18}
              color={c.accent}
            />
            <Text style={[styles.rowLabel, { color: c.text }]}>No person</Text>
          </Pressable>
          {people.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => onSelect(p)}
              style={[styles.row, webClickable]}
            >
              <Ionicons
                name={selectedId === p.id ? "checkmark-circle" : "person-outline"}
                size={18}
                color={c.accent}
              />
              <Text style={[styles.rowLabel, { color: c.text }]}>{p.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {selectedId ? (
          <View style={styles.roleRow}>
            {roles.map((role) => {
              const on = personRole === role;
              return (
                <Pressable
                  key={role}
                  onPress={() => onRoleChange(role)}
                  style={[
                    styles.roleChip,
                    {
                      borderColor: c.border,
                      backgroundColor: on ? c.accent : c.inputBg,
                    },
                    webClickable,
                  ]}
                >
                  <Text
                    style={{
                      color: on ? c.onAccent : c.textSecondary,
                      fontSize: 12,
                      fontWeight: "700",
                    }}
                  >
                    {personRoleLabel(role)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <GhostButton label="+ ADD PERSON" onPress={onAddNew} style={styles.addBtn} />
      </Pressable>
    </Pressable>
  );

  if (isWeb) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        {sheet}
      </Modal>
    );
  }

  if (!visible) return null;
  return <View style={styles.nativeOverlay}>{sheet}</View>;
}

const styles = StyleSheet.create({
  nativeOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 80,
    elevation: 80,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  backdropCentered: {
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    maxHeight: "70%",
    elevation: 12,
  },
  webCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: 480,
    alignSelf: "center",
  },
  webScroll: { maxHeight: 280 },
  title: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  rowLabel: { fontSize: 15, fontWeight: "500" },
  roleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  roleChip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addBtn: { marginTop: 8 },
});
