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
import { useFocusEffect, useRouter } from "expo-router";

import { AccountEditorModal } from "@/components/AccountEditorModal";
import { ActionMenu } from "@/components/ActionMenu";
import { AppHeader } from "@/components/AppHeader";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Fab } from "@/components/Fab";
import { GhostButton } from "@/components/GhostButton";
import { IgnoredAccountsModal } from "@/components/IgnoredAccountsModal";
import { MoneyText } from "@/components/MoneyText";
import { TotalsHeader } from "@/components/TotalsHeader";
import {
  archiveAccount,
  countAccountRecords,
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
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAccount, setMenuAccount] = useState<AccountWithBalance | null>(null);
  const [ignoredOpen, setIgnoredOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    account: AccountWithBalance;
    related: number;
  } | null>(null);
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
            <View style={styles.footer}>
              <GhostButton
                label="+ ADD NEW ACCOUNT"
                onPress={() => setEditor({ mode: "create" })}
              />
              <GhostButton
                label="RETRIEVE IGNORED ACCOUNTS"
                onPress={() => setIgnoredOpen(true)}
              />
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.name} details`}
                onPress={() => router.push(`/account/${item.id}` as never)}
                style={({ pressed }) => [styles.cardMain, pressed && styles.cardPressed]}
              >
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
              </Pressable>
              <Pressable
                onPress={() => setMenuAccount(item)}
                hitSlop={10}
                style={styles.more}
                accessibilityRole="button"
                accessibilityLabel={`${item.name} menu`}
              >
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
              const account = menuAccount;
              void countAccountRecords(account.id).then((related) => {
                setDeleteTarget({ account, related });
              });
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

      <ConfirmModal
        visible={deleteTarget != null}
        title="Delete account?"
        message={
          deleteTarget
            ? deleteTarget.related > 0
              ? `Delete “${deleteTarget.account.name}”? All ${deleteTarget.related} related record${deleteTarget.related === 1 ? "" : "s"} (including transfers) will be deleted as well. This cannot be undone.`
              : `Delete “${deleteTarget.account.name}”? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          const id = deleteTarget.account.id;
          setDeleteTarget(null);
          void deleteAccount(id)
            .then(reload)
            .catch((e) => setError(e instanceof Error ? e.message : "Delete failed"));
        }}
      />

      <IgnoredAccountsModal
        visible={ignoredOpen}
        onClose={() => setIgnoredOpen(false)}
        onChanged={() => void reload()}
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
  footer: {
    marginTop: 8,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 4,
    paddingLeft: 12,
    paddingRight: 4,
    gap: 4,
    backgroundColor: colors.surface,
  },
  cardMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  cardPressed: { opacity: 0.9 },
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
