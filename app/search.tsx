import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme";

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.accentMuted} />
        <TextInput
          autoFocus
          placeholder="Search for records"
          placeholderTextColor={colors.accentMuted}
          style={styles.input}
        />
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
      </View>
      <View style={styles.empty}>
        <Ionicons name="document-text-outline" size={48} color={colors.accentMuted} />
        <Text style={styles.hint}>
          Search records by notes, category name or account name
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.accentMuted,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    padding: 0,
  },
  cancel: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "500",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  hint: {
    color: colors.accentMuted,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
});
