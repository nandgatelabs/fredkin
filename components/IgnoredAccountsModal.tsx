import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AccountEditorModal } from "@/components/AccountEditorModal";
import { ActionMenu } from "@/components/ActionMenu";
import { ConfirmModal } from "@/components/ConfirmModal";
import { MoneyText } from "@/components/MoneyText";
import {
  countAccountRecords,
  deleteAccount,
  listIgnoredAccounts,
  restoreAccount,
  updateAccount,
} from "@/db/accounts";
import type { AccountWithBalance } from "@/db/types";
import { useKeydown } from "@/hooks/useKeydown";
import { accountIcon } from "@/lib/icons";
import { webClickable } from "@/lib/web";
import { colors } from "@/theme";
import { layout } from "@/theme/layout";

type Props = {
  visible: boolean;
  onClose: () => void;
  onChanged: () => void;
};

export function IgnoredAccountsModal({ visible, onClose, onChanged }: Props) {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuAccount, setMenuAccount] = useState<AccountWithBalance | null>(null);
  const [editorAccount, setEditorAccount] = useState<AccountWithBalance | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    account: AccountWithBalance;
    related: number;
  } | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAccounts(await listIgnoredAccounts());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load ignored accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) void reload();
  }, [visible, reload]);

  useKeydown(
    visible && !menuAccount && !editorAccount && !deleteTarget,
    useCallback(
      (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      },
      [onClose],
    ),
  );

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.title}>Ignored wallets</Text>
              <Pressable onPress={onClose} hitSlop={10} style={webClickable}>
                <Ionicons name="close" size={22} color={colors.accent} />
              </Pressable>
            </View>
            <Text style={styles.hint}>
              Restore a wallet to show it again on the Wallets tab. Edit or delete
              permanently from here.
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {loading && accounts.length === 0 ? (
              <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />
            ) : accounts.length === 0 ? (
              <Text style={styles.empty}>No ignored wallets</Text>
            ) : (
              <FlatList
                data={accounts}
                keyExtractor={(item) => item.id}
                style={styles.list}
                renderItem={({ item }) => (
                  <View style={styles.row}>
                    <View style={styles.iconWrap}>
                      <Ionicons
                        name={accountIcon(item.icon_key)}
                        size={20}
                        color={colors.accentMuted}
                      />
                    </View>
                    <View style={styles.rowBody}>
                      <Text style={styles.name}>{item.name}</Text>
                      <View style={styles.balanceRow}>
                        <Text style={styles.balanceLabel}>Balance: </Text>
                        <MoneyText amount={item.balance} />
                      </View>
                    </View>
                    <Pressable
                      onPress={() => setMenuAccount(item)}
                      hitSlop={10}
                      style={webClickable}
                    >
                      <Ionicons
                        name="ellipsis-horizontal"
                        size={20}
                        color={colors.accentMuted}
                      />
                    </Pressable>
                  </View>
                )}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <ActionMenu
        visible={menuAccount != null}
        title={menuAccount?.name}
        onClose={() => setMenuAccount(null)}
        items={[
          {
            label: "Restore",
            onPress: () => {
              if (!menuAccount) return;
              const id = menuAccount.id;
              void restoreAccount(id)
                .then(async () => {
                  await reload();
                  onChanged();
                })
                .catch((e) =>
                  setError(e instanceof Error ? e.message : "Restore failed"),
                );
            },
          },
          {
            label: "Edit",
            onPress: () => {
              if (menuAccount) setEditorAccount(menuAccount);
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
        ]}
      />

      <AccountEditorModal
        visible={editorAccount != null}
        mode="edit"
        initial={
          editorAccount
            ? {
                name: editorAccount.name,
                opening_balance: editorAccount.opening_balance,
                icon_key: editorAccount.icon_key,
              }
            : undefined
        }
        onCancel={() => setEditorAccount(null)}
        onSave={async (values) => {
          if (!editorAccount) return;
          await updateAccount(editorAccount.id, values);
          setEditorAccount(null);
          await reload();
          onChanged();
        }}
      />

      <ConfirmModal
        visible={deleteTarget != null}
        title="Delete wallet?"
        message={
          deleteTarget
            ? deleteTarget.related > 0
              ? `Delete “${deleteTarget.account.name}”? All ${deleteTarget.related} related event${deleteTarget.related === 1 ? "" : "s"} (including transfers) will be deleted as well. This cannot be undone.`
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
            .then(async () => {
              await reload();
              onChanged();
            })
            .catch((e) => setError(e instanceof Error ? e.message : "Delete failed"));
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    width: "100%",
    maxWidth: layout.dialogMaxWidth,
    alignSelf: "center",
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: "700",
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  list: {
    flexGrow: 0,
  },
  empty: {
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: 28,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, gap: 2, minWidth: 0 },
  name: { color: colors.accent, fontSize: 15, fontWeight: "500" },
  balanceRow: { flexDirection: "row", alignItems: "center" },
  balanceLabel: { color: colors.textSecondary, fontSize: 12 },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 8,
  },
});
