import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MoneyText } from "@/components/MoneyText";
import type { AccountWithBalance } from "@/db/types";
import { accountIcon } from "@/lib/icons";
import { webClickable } from "@/lib/web";
import { colors } from "@/theme";

type Props = {
  visible: boolean;
  accounts: AccountWithBalance[];
  selectedId?: string | null;
  excludeId?: string | null;
  onClose: () => void;
  onSelect: (account: AccountWithBalance) => void;
};

export function AccountPickerModal({
  visible,
  accounts,
  selectedId,
  excludeId,
  onClose,
  onSelect,
}: Props) {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const data = excludeId
    ? accounts.filter((a) => a.id !== excludeId)
    : accounts;

  const body = (
    <View
      style={[
        isWeb ? styles.webCard : styles.screen,
        !isWeb && { paddingTop: insets.top + 12, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={10} style={webClickable}>
          <Ionicons name="close" size={24} color={colors.accent} />
        </Pressable>
        <Text style={styles.title}>Select an account</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        style={isWeb ? styles.webList : undefined}
        renderItem={({ item }) => {
          const selected = item.id === selectedId;
          return (
            <Pressable
              style={[styles.row, selected && styles.rowSelected, webClickable]}
              onPress={() => onSelect(item)}
            >
              <View style={styles.iconWrap}>
                <Ionicons
                  name={accountIcon(item.icon_key)}
                  size={22}
                  color={colors.accent}
                />
              </View>
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
              <MoneyText amount={item.balance} />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No accounts available. Add one on the Accounts tab.
          </Text>
        }
      />
    </View>
  );

  if (!isWeb) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        {body}
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.webRoot}>
        <Pressable style={styles.webBackdrop} onPress={onClose} accessibilityLabel="Dismiss" />
        {body}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  webBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  webCard: {
    zIndex: 1,
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingTop: 14,
    overflow: "hidden",
  },
  webList: {
    maxHeight: 420,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowSelected: {
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    flex: 1,
    color: colors.accent,
    fontSize: 16,
    fontWeight: "500",
  },
  empty: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 40,
    paddingHorizontal: 24,
    lineHeight: 20,
  },
});
