import {
  Modal,
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
import { categoryColor, categoryIcon } from "@/lib/icons";
import { colors } from "@/theme";

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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.title}>Select a category</Text>
          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {categories.map((cat) => {
              const bg = cat.color ?? categoryColor(cat.icon_key);
              const selected = cat.id === selectedId;
              return (
                <Pressable
                  key={cat.id}
                  style={styles.cell}
                  onPress={() => onSelect(cat)}
                >
                  <View
                    style={[
                      styles.circle,
                      { backgroundColor: bg },
                      selected && styles.circleSelected,
                    ]}
                  >
                    <Ionicons name={categoryIcon(cat.icon_key)} size={22} color="#fff" />
                  </View>
                  <Text style={styles.label} numberOfLines={2}>
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <GhostButton label="+ ADD NEW CATEGORY" onPress={onAddNew} style={styles.addBtn} />
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
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "72%",
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  title: {
    color: colors.accent,
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
  circleSelected: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  label: {
    color: colors.accent,
    fontSize: 12,
    textAlign: "center",
  },
  addBtn: {
    marginTop: 4,
  },
});
