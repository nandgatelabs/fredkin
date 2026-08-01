import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GhostButton } from "@/components/GhostButton";
import type { Category } from "@/db/types";
import { useThemeColors } from "@/hooks/useThemeColors";
import { categoryColor, categoryIcon } from "@/lib/icons";
import { webClickable } from "@/lib/web";

type Props = {
  visible: boolean;
  categories: Category[];
  selectedId?: string | null;
  onClose: () => void;
  onSelect: (category: Category) => void;
  onAddNew: () => void;
};

export function CategoryPickerModal({
  visible,
  categories,
  selectedId,
  onClose,
  onSelect,
  onAddNew,
}: Props) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const isWeb = Platform.OS === "web";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, isWeb && styles.backdropCentered]}
        onPress={onClose}
      >
        <Pressable
          style={[
            isWeb ? styles.webCard : styles.sheet,
            {
              backgroundColor: c.dialog,
              borderColor: c.border,
            },
            !isWeb && { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: c.accent }]}>Select an event type</Text>
          <ScrollView
            contentContainerStyle={styles.grid}
            style={isWeb ? styles.webScroll : undefined}
            showsVerticalScrollIndicator={false}
          >
            {categories.map((cat) => {
              const bg = cat.color ?? categoryColor(cat.icon_key);
              const selected = cat.id === selectedId;
              return (
                <Pressable
                  key={cat.id}
                  style={[styles.cell, webClickable]}
                  onPress={() => onSelect(cat)}
                >
                  <View
                    style={[
                      styles.circle,
                      { backgroundColor: bg },
                      selected && { borderWidth: 2, borderColor: c.accent },
                    ]}
                  >
                    <Ionicons name={categoryIcon(cat.icon_key)} size={22} color="#fff" />
                  </View>
                  <Text style={[styles.label, { color: c.accent }]} numberOfLines={2}>
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <GhostButton label="+ ADD EVENT TYPE" onPress={onAddNew} style={styles.addBtn} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  backdropCentered: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "72%",
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  webCard: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  webScroll: {
    maxHeight: 360,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: 8,
  },
  cell: {
    width: "33.33%",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    textAlign: "center",
  },
  addBtn: {
    marginTop: 4,
  },
});
