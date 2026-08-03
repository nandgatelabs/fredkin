import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AccountPickerModal } from "@/components/AccountPickerModal";
import { CalculatorKeypad } from "@/components/CalculatorKeypad";
import { CategoryEditorModal } from "@/components/CategoryEditorModal";
import { CategoryPickerModal } from "@/components/CategoryPickerModal";
import { DatePickerModal, TimePickerModal } from "@/components/DateTimePickers";
import { InfoModal } from "@/components/InfoModal";
import { listAccounts } from "@/db/accounts";
import { createCategory, listCategories } from "@/db/categories";
import { createRecord, getRecord, updateRecord } from "@/db/records";
import type { AccountWithBalance, Category, RecordType } from "@/db/types";
import { parseOccurredAt } from "@/lib/recordsUi";
import { useKeydown } from "@/hooks/useKeydown";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  appendDecimal,
  appendDigit,
  appendOperator,
  backspace,
  evaluateExpression,
  formatResult,
  resolveAmount,
} from "@/lib/calculator";
import {
  formatComposerDate,
  formatComposerTime,
  toIsoLocal,
} from "@/lib/datetime";
import { accountIcon, categoryColor, categoryIcon } from "@/lib/icons";
import { log } from "@/lib/logger";
import { webClickable } from "@/lib/web";

const TYPES: RecordType[] = ["income", "expense", "transfer"];

const TYPE_LABELS: Record<RecordType, string> = {
  income: "INCOME",
  expense: "SPEND",
  transfer: "TRANSFER",
};

export default function NewRecordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = typeof params.id === "string" ? params.id : undefined;

  const [type, setType] = useState<RecordType>("expense");
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [account, setAccount] = useState<AccountWithBalance | null>(null);
  const [toAccount, setToAccount] = useState<AccountWithBalance | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [note, setNote] = useState("");
  const [expression, setExpression] = useState("0");
  const [occurredAt, setOccurredAt] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydratedEdit, setHydratedEdit] = useState(false);

  const [accountPicker, setAccountPicker] = useState<"from" | "to" | null>(null);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);

  const categoryType = type === "income" ? "income" : "expense";

  const reloadMeta = useCallback(async () => {
    const [accs, cats] = await Promise.all([
      listAccounts(),
      type === "transfer" ? Promise.resolve([] as Category[]) : listCategories(categoryType),
    ]);
    setAccounts(accs);
    setCategories(cats);
    // Keep selections only if still valid — never auto-pick account/category.
    setAccount((prev) => (prev && accs.some((a) => a.id === prev.id) ? prev : null));
    setToAccount((prev) => (prev && accs.some((a) => a.id === prev.id) ? prev : null));
    setCategory((prev) => {
      if (type === "transfer") return null;
      if (prev && cats.some((c) => c.id === prev.id)) return prev;
      return null;
    });
  }, [categoryType, type]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      await reloadMeta();
      if (!editId || hydratedEdit) return;
      const existing = await getRecord(editId);
      if (!existing || cancelled) return;
      const accs = await listAccounts();
      const cats =
        existing.type === "transfer"
          ? []
          : await listCategories(existing.type === "income" ? "income" : "expense");
      setType(existing.type);
      setExpression(String(existing.amount));
      setNote(existing.note);
      setOccurredAt(parseOccurredAt(existing.occurred_at));
      setAccount(accs.find((a) => a.id === existing.account_id) ?? null);
      setToAccount(
        existing.to_account_id
          ? (accs.find((a) => a.id === existing.to_account_id) ?? null)
          : null,
      );
      setCategory(
        existing.category_id
          ? (cats.find((c) => c.id === existing.category_id) ?? null)
          : null,
      );
      setHydratedEdit(true);
    })()
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editId, hydratedEdit, reloadMeta]);

  const filteredCategories = useMemo(
    () => (type === "transfer" ? [] : categories),
    [categories, type],
  );

  function handleTypeChange(next: RecordType) {
    setType(next);
    setCategory(null);
    setError(null);
  }

  const handleSave = useCallback(async () => {
    const amount = resolveAmount(expression);
    if (amount == null || amount <= 0) {
      setError("Enter an amount greater than 0");
      return;
    }
    if (!account) {
      setError(
        type === "transfer" ? "Select a From account" : "Select an account",
      );
      return;
    }
    if (type === "transfer") {
      if (!toAccount) {
        setError("Select a To account");
        return;
      }
      if (toAccount.id === account.id) {
        setError("From and To accounts must be different");
        return;
      }
    }

    try {
      setBusy(true);
      setError(null);
      const payload = {
        type,
        amount,
        account_id: account.id,
        to_account_id: type === "transfer" ? toAccount!.id : null,
        category_id: type === "transfer" ? null : (category?.id ?? null),
        note,
        occurred_at: toIsoLocal(occurredAt),
      };
      if (editId) await updateRecord(editId, payload);
      else await createRecord(payload);
      log.info(editId ? "Record updated" : "Record created", {
        type,
        amount,
      });
      router.back();
    } catch (e) {
      log.error("Record save failed", e);
      setError(e instanceof Error ? e.message : "Save failed");
      setBusy(false);
    }
  }, [
    account,
    category?.id,
    editId,
    expression,
    occurredAt,
    router,
    toAccount,
    type,
    note,
  ]);

  const overlayOpen =
    accountPicker != null ||
    categoryPickerOpen ||
    categoryEditorOpen ||
    dateOpen ||
    timeOpen;

  useKeydown(
    !overlayOpen,
    useCallback(
      (event) => {
        const tag = (event.target as HTMLElement | null)?.tagName?.toLowerCase();
        const typing = tag === "input" || tag === "textarea";

        if (event.key === "Escape") {
          event.preventDefault();
          if (!busy) router.back();
          return;
        }

        if (typing) {
          if (event.key === "Enter" && event.metaKey) {
            event.preventDefault();
            if (!busy) void handleSave();
          }
          return;
        }

        if (event.key === "Enter") {
          event.preventDefault();
          if (event.shiftKey || event.metaKey || event.ctrlKey) {
            if (!busy) void handleSave();
            return;
          }
          setExpression((e) => {
            const v = evaluateExpression(e);
            return v == null ? "Error" : formatResult(v);
          });
          return;
        }

        if (event.key === "Backspace") {
          event.preventDefault();
          setExpression((e) => backspace(e));
          return;
        }

        if (/^[0-9]$/.test(event.key)) {
          event.preventDefault();
          setExpression((e) => appendDigit(e, event.key));
          return;
        }
        if (event.key === ".") {
          event.preventDefault();
          setExpression((e) => appendDecimal(e));
          return;
        }
        if (event.key === "+") {
          event.preventDefault();
          setExpression((e) => appendOperator(e, "+"));
          return;
        }
        if (event.key === "-") {
          event.preventDefault();
          setExpression((e) => appendOperator(e, "-"));
          return;
        }
        if (event.key === "*" || event.key === "x" || event.key === "X") {
          event.preventDefault();
          setExpression((e) => appendOperator(e, "×"));
          return;
        }
        if (event.key === "/") {
          event.preventDefault();
          setExpression((e) => appendOperator(e, "÷"));
          return;
        }
        if (event.key === "=") {
          event.preventDefault();
          setExpression((e) => {
            const v = evaluateExpression(e);
            return v == null ? "Error" : formatResult(v);
          });
        }
      },
      [busy, handleSave, router],
    ),
  );

  const isWeb = Platform.OS === "web";
  const composerPad = {
    paddingTop: isWeb ? 12 : insets.top + 8,
    paddingBottom: isWeb ? 12 : insets.bottom,
  };

  const composer = (
    <View
      style={[
        styles.screen,
        { backgroundColor: c.background },
        isWeb && [
          styles.webCard,
          { borderColor: c.border, backgroundColor: c.background },
        ],
        composerPad,
      ]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (!busy) router.back();
          }}
          hitSlop={10}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Discard"
          style={[styles.headerBtn, webClickable]}
        >
          <Text style={[styles.action, { color: c.accent }]}>Discard</Text>
        </Pressable>
        {isWeb ? (
          <Text style={[styles.keyboardHint, { color: c.textSecondary }]}>
            keys · Esc · Enter/=
          </Text>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <Pressable
          onPress={() => void handleSave()}
          hitSlop={10}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Save"
          style={[
            styles.headerBtn,
            styles.saveBtn,
            { backgroundColor: c.accent },
            webClickable,
            busy && styles.actionDisabled,
          ]}
        >
          <Text style={[styles.saveLabel, { color: c.onAccent }]}>
            {busy ? "…" : "Save"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.typeRow}>
        {TYPES.map((t, i) => {
          const selected = type === t;
          return (
            <View key={t} style={styles.typeCell}>
              {i > 0 ? (
                <Text style={[styles.typeDivider, { color: c.border }]}>|</Text>
              ) : null}
              <Pressable style={styles.typeBtn} onPress={() => handleTypeChange(t)}>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={16} color={c.accent} />
                ) : (
                  <View style={styles.typeSpacer} />
                )}
                <Text
                  style={[
                    styles.typeLabel,
                    { color: selected ? c.accent : c.textSecondary },
                  ]}
                >
                  {TYPE_LABELS[t]}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.pickRow}>
            <PickerField
              label={type === "transfer" ? "From" : undefined}
              onPress={() => setAccountPicker("from")}
              colors={c}
            >
              {account ? (
                <>
                  <Ionicons
                    name={accountIcon(account.icon_key)}
                    size={18}
                    color={c.accent}
                  />
                  <Text style={[styles.pickValue, { color: c.accent }]} numberOfLines={1}>
                    {account.name}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="wallet-outline" size={18} color={c.accentMuted} />
                  <Text style={[styles.pickPlaceholder, { color: c.textSecondary }]}>
                    Wallet
                  </Text>
                </>
              )}
            </PickerField>

            {type === "transfer" ? (
              <PickerField label="To" onPress={() => setAccountPicker("to")} colors={c}>
                {toAccount ? (
                  <>
                    <Ionicons
                      name={accountIcon(toAccount.icon_key)}
                      size={18}
                      color={c.accent}
                    />
                    <Text style={[styles.pickValue, { color: c.accent }]} numberOfLines={1}>
                      {toAccount.name}
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="wallet-outline" size={18} color={c.accentMuted} />
                    <Text style={[styles.pickPlaceholder, { color: c.textSecondary }]}>
                      Wallet
                    </Text>
                  </>
                )}
              </PickerField>
            ) : (
              <PickerField onPress={() => setCategoryPickerOpen(true)} colors={c}>
                {category ? (
                  <>
                    <View
                      style={[
                        styles.catDot,
                        {
                          backgroundColor:
                            category.color ?? categoryColor(category.icon_key),
                        },
                      ]}
                    >
                      <Ionicons
                        name={categoryIcon(category.icon_key)}
                        size={12}
                        color="#fff"
                      />
                    </View>
                    <Text style={[styles.pickValue, { color: c.accent }]} numberOfLines={1}>
                      {category.name}
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="pricetag-outline" size={18} color={c.accentMuted} />
                    <Text style={[styles.pickPlaceholder, { color: c.textSecondary }]}>
                      Event type
                    </Text>
                  </>
                )}
              </PickerField>
            )}
          </View>

          <TextInput
            style={[
              styles.notes,
              {
                borderColor: c.border,
                color: c.text,
                backgroundColor: c.inputBg,
              },
            ]}
            placeholder="Add notes"
            placeholderTextColor={c.textSecondary}
            value={note}
            onChangeText={setNote}
            multiline
          />

          <View style={styles.keypadBlock}>
            <CalculatorKeypad
              expression={expression}
              onDigit={(d) => setExpression((e) => appendDigit(e, d))}
              onDecimal={() => setExpression((e) => appendDecimal(e))}
              onOperator={(op) => setExpression((e) => appendOperator(e, op))}
              onBackspace={() => setExpression((e) => backspace(e))}
              onEquals={() =>
                setExpression((e) => {
                  const v = evaluateExpression(e);
                  return v == null ? "Error" : formatResult(v);
                })
              }
            />
          </View>

          <View style={[styles.footer, { borderColor: c.border }]}>
            <Pressable onPress={() => setDateOpen(true)} style={styles.footerBtn}>
              <Text style={[styles.footerText, { color: c.accent }]}>
                {formatComposerDate(occurredAt)}
              </Text>
            </Pressable>
            <View style={[styles.footerDivider, { backgroundColor: c.border }]} />
            <Pressable onPress={() => setTimeOpen(true)} style={styles.footerBtn}>
              <Text style={[styles.footerText, { color: c.accent }]}>
                {formatComposerTime(occurredAt)}
              </Text>
            </Pressable>
          </View>
        </>
      )}

      <AccountPickerModal
        visible={accountPicker != null}
        accounts={accounts}
        selectedId={accountPicker === "to" ? toAccount?.id : account?.id}
        excludeId={accountPicker === "to" ? account?.id : accountPicker === "from" && type === "transfer" ? toAccount?.id : null}
        onClose={() => setAccountPicker(null)}
        onSelect={(a) => {
          if (accountPicker === "to") setToAccount(a);
          else setAccount(a);
          setAccountPicker(null);
        }}
      />

      <CategoryPickerModal
        visible={categoryPickerOpen}
        categories={filteredCategories}
        selectedId={category?.id}
        onClose={() => setCategoryPickerOpen(false)}
        onSelect={(c) => {
          setCategory(c);
          setCategoryPickerOpen(false);
        }}
        onAddNew={() => {
          setCategoryPickerOpen(false);
          setCategoryEditorOpen(true);
        }}
      />

      <CategoryEditorModal
        visible={categoryEditorOpen}
        mode="create"
        initial={{ type: categoryType }}
        onCancel={() => setCategoryEditorOpen(false)}
        onSave={async (values) => {
          const created = await createCategory(values);
          await reloadMeta();
          setCategory(created);
          setCategoryEditorOpen(false);
        }}
      />

      <DatePickerModal
        visible={dateOpen}
        value={occurredAt}
        onCancel={() => setDateOpen(false)}
        onConfirm={(d) => {
          setOccurredAt(d);
          setDateOpen(false);
        }}
      />
      <TimePickerModal
        visible={timeOpen}
        value={occurredAt}
        onCancel={() => setTimeOpen(false)}
        onConfirm={(d) => {
          setOccurredAt(d);
          setTimeOpen(false);
        }}
      />

      <InfoModal
        visible={error != null}
        title="Add event"
        message={error ?? ""}
        onClose={() => setError(null)}
      />
    </View>
  );

  if (!isWeb) return composer;

  return (
    <View style={styles.webRoot}>
      <Pressable
        style={styles.webBackdrop}
        onPress={() => {
          if (!busy && !overlayOpen) router.back();
        }}
        accessibilityLabel="Dismiss"
      />
      {composer}
    </View>
  );
}

function PickerField({
  label,
  onPress,
  children,
  colors: c,
}: {
  label?: string;
  onPress: () => void;
  children: ReactNode;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={styles.pickField}>
      {label ? (
        <Text style={[styles.pickLabel, { color: c.textSecondary }]}>{label}</Text>
      ) : null}
      <Pressable
        style={[
          styles.pickBox,
          { borderColor: c.border, backgroundColor: c.inputBg },
          webClickable,
        ]}
        onPress={onPress}
      >
        {children}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  webBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  /** Wider rectangle for laptop/web — not a tall phone sheet. */
  webCard: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 560,
    height: 600,
    maxHeight: "85%",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    zIndex: 1,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
    gap: 8,
  },
  headerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtn: {},
  saveLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  keyboardHint: {
    fontSize: 11,
  },
  headerSpacer: {
    flex: 1,
  },
  action: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionDisabled: {
    opacity: 0.5,
  },
  typeRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  typeCell: {
    flexDirection: "row",
    alignItems: "center",
  },
  typeDivider: {
    marginHorizontal: 6,
  },
  typeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  typeSpacer: {
    width: 16,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  pickRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  pickField: {
    flex: 1,
  },
  pickLabel: {
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 2,
  },
  pickBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  pickValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  pickPlaceholder: {
    flex: 1,
    fontSize: 14,
  },
  catDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  notes: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 72,
    textAlignVertical: "top",
    marginBottom: 8,
  },
  keypadBlock: {
    flexShrink: 0,
  },
  footer: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
  },
  footerBtn: {
    flex: 1,
    alignItems: "center",
  },
  footerDivider: {
    width: StyleSheet.hairlineWidth,
  },
  footerText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
