import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

import { AccountEditorModal } from "@/components/AccountEditorModal";
import { ActionMenu } from "@/components/ActionMenu";
import { AppHeader } from "@/components/AppHeader";
import { Fab } from "@/components/Fab";
import { GhostButton } from "@/components/GhostButton";
import { MoneyText } from "@/components/MoneyText";
import { TotalsHeader } from "@/components/TotalsHeader";
import {
  archiveAccount,
  createAccount,
  deleteAccount,
  getLifetimeTotals,
  listAccounts,
  updateAccount,
} from "@/db/accounts";
import type { AccountWithBalance, Totals } from "@/db/types";
import { accountIcon } from "@/lib/icons";
import { colors } from "@/theme";

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAccount, setMenuAccount] = useState<AccountWithBalance | null>(null);
  const [editor, setEditor] = useState<
    | { mode: "create" }
    | { mode: "edit"; account: AccountWithBalance }
    | null
  >(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, lifetime] = await Promise.all([listAccounts(), getLifetimeTotals()]);
      setAccounts(list);
      setTotals(lifetime);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return (
    <View style={styles.screen}>
      <AppHeader />
      {totals ? <TotalsHeader totals={totals} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && accounts.length === 0 ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<Text style={styles.section}>Accounts</Text>}
          ListFooterComponent={
            <GhostButton
              label="+ ADD NEW ACCOUNT"
              onPress={() => setEditor({ mode: "create" })}
              style={{ marginTop: 8 }}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.iconWrap}>
                <Ionicons name={accountIcon(item.icon_key)} size={22} color={colors.accent} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>Balance: </Text>
                  <MoneyText amount={item.balance} />
                </View>
              </View>
              <Pressable onPress={() => setMenuAccount(item)} hitSlop={10} style={styles.more}>
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.accentMuted} />
              </Pressable>
            </View>
          )}
        />
      )}

      <Fab />

      <ActionMenu
        visible={menuAccount != null}
        title={menuAccount?.name}
        onClose={() => setMenuAccount(null)}
        items={[
          {
            label: "Edit",
            onPress: () => {
              if (menuAccount) setEditor({ mode: "edit", account: menuAccount });
            },
          },
          {
            label: "Delete",
            destructive: true,
            onPress: () => {
              if (!menuAccount) return;
              void deleteAccount(menuAccount.id)
                .then(reload)
                .catch((e) =>
                  setError(e instanceof Error ? e.message : "Delete failed"),
                );
            },
          },
          {
            label: "Ignore",
            onPress: () => {
              if (!menuAccount) return;
              void archiveAccount(menuAccount.id)
                .then(reload)
                .catch((e) =>
                  setError(e instanceof Error ? e.message : "Ignore failed"),
                );
            },
          },
        ]}
      />

      <AccountEditorModal
        visible={editor != null}
        mode={editor?.mode === "edit" ? "edit" : "create"}
        initial={
          editor?.mode === "edit"
            ? {
                name: editor.account.name,
                opening_balance: editor.account.opening_balance,
                icon_key: editor.account.icon_key,
              }
            : undefined
        }
        onCancel={() => setEditor(null)}
        onSave={async (values) => {
          if (editor?.mode === "edit") {
            await updateAccount(editor.account.id, values);
          } else {
            await createAccount(values);
          }
          setEditor(null);
          await reload();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },
  section: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.accentMuted,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    backgroundColor: colors.surface,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, gap: 4 },
  name: { color: colors.accent, fontSize: 16, fontWeight: "500" },
  balanceRow: { flexDirection: "row", alignItems: "center" },
  balanceLabel: { color: colors.textSecondary, fontSize: 13 },
  more: { padding: 4 },
  error: {
    color: colors.danger,
    paddingHorizontal: 16,
    marginBottom: 8,
    fontSize: 13,
  },
});
