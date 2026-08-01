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
import { useThemeColors } from "@/hooks/useThemeColors";
import { accountIcon } from "@/lib/icons";
import { webClickable } from "@/lib/web";

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
  const c = useThemeColors();
  const isWeb = Platform.OS === "web";
  const data = excludeId
    ? accounts.filter((a) => a.id !== excludeId)
    : accounts;

  const body = (
    <View
      style={[
        isWeb ? styles.webCard : styles.screen,
        {
          backgroundColor: isWeb ? c.dialog : c.background,
          borderColor: c.border,
        },
        !isWeb && { paddingTop: insets.top + 12, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={10} style={webClickable}>
          <Ionicons name="close" size={24} color={c.accent} />
        </Pressable>
        <Text style={[styles.title, { color: c.accent }]}>Select a wallet</Text>
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
              style={[
                styles.row,
                { borderBottomColor: c.border },
                selected && { backgroundColor: c.background, borderRadius: 8 },
                webClickable,
              ]}
              onPress={() => onSelect(item)}
            >
              <View style={[styles.iconWrap, { backgroundColor: c.background }]}>
                <Ionicons
                  name={accountIcon(item.icon_key)}
                  size={22}
                  color={c.accent}
                />
              </View>
              <Text style={[styles.name, { color: c.accent }]} numberOfLines={2}>
                {item.name}
              </Text>
              <MoneyText amount={item.balance} />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: c.textSecondary }]}>
            No wallets available. Add one on the Wallets tab.
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
  },
  webRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  webBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  webCard: {
    zIndex: 1,
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
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
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    paddingHorizontal: 24,
    lineHeight: 20,
  },
});
