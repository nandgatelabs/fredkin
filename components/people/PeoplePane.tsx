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

import { ActionMenu } from "@/components/ActionMenu";
import { ConfirmModal } from "@/components/ConfirmModal";
import { GhostButton } from "@/components/GhostButton";
import { PersonEditorModal } from "@/components/PersonEditorModal";
import {
  createPerson,
  deletePerson,
  listPeople,
  updatePerson,
  type PersonListItem,
} from "@/db/people";
import { formatMoney } from "@/lib/money";
import { colors } from "@/theme";

function personListMeta(item: PersonListItem): string {
  const parts: string[] = [];
  if (item.theyOwe > 0) {
    parts.push(`They owe ${formatMoney(item.theyOwe, { sign: "never" })}`);
  }
  if (item.youOwe > 0) {
    parts.push(`You owe ${formatMoney(item.youOwe, { sign: "never" })}`);
  }
  if (item.spentOn > 0) {
    parts.push(`Spent ${formatMoney(item.spentOn, { sign: "never" })}`);
  }
  return parts.join(" · ") || "No events yet";
}

type Props = {
  onOpenPerson?: (id: string) => void;
  listBottomPad?: number;
};

export function PeoplePane({ onOpenPerson, listBottomPad = 40 }: Props) {
  const [people, setPeople] = useState<PersonListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<PersonListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PersonListItem | null>(null);
  const [editor, setEditor] = useState<
    { mode: "create" } | { mode: "edit"; person: PersonListItem } | null
  >(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPeople(await listPeople());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load people");
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
    <View style={styles.root}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && people.length === 0 ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={people}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: listBottomPad, paddingHorizontal: 16 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Add someone to tag gifts and IOUs.</Text>
          }
          ListFooterComponent={
            <GhostButton
              label="+ ADD PERSON"
              onPress={() => setEditor({ mode: "create" })}
              style={{ marginTop: 16 }}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Pressable
                onPress={() => onOpenPerson?.(item.id)}
                style={styles.cardMain}
                accessibilityRole="button"
                accessibilityLabel={item.name}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name="person-outline" size={22} color={colors.accent} />
                </View>
                <View style={styles.body}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta} numberOfLines={2}>
                    {personListMeta(item)}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => setMenu(item)}
                hitSlop={10}
                accessibilityLabel={`${item.name} menu`}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.accentMuted} />
              </Pressable>
            </View>
          )}
        />
      )}

      <ActionMenu
        visible={menu != null}
        title={menu?.name}
        onClose={() => setMenu(null)}
        items={[
          {
            label: "Edit",
            onPress: () => {
              if (menu) setEditor({ mode: "edit", person: menu });
            },
          },
          {
            label: "Delete",
            destructive: true,
            onPress: () => setDeleteTarget(menu),
          },
        ]}
      />

      <ConfirmModal
        visible={deleteTarget != null}
        title="Delete person?"
        message={
          deleteTarget
            ? `Remove “${deleteTarget.name}”? Events stay; they just lose this person tag.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          void deletePerson(deleteTarget.id)
            .then(() => {
              setDeleteTarget(null);
              return reload();
            })
            .catch((e) => setError(e instanceof Error ? e.message : "Delete failed"));
        }}
      />

      <PersonEditorModal
        visible={editor != null}
        mode={editor?.mode === "edit" ? "edit" : "create"}
        initial={
          editor?.mode === "edit"
            ? { name: editor.person.name, note: editor.person.note }
            : undefined
        }
        onCancel={() => setEditor(null)}
        onSave={async (values) => {
          if (editor?.mode === "edit") await updatePerson(editor.person.id, values);
          else await createPerson(values);
          setEditor(null);
          await reload();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  error: { color: colors.expense, padding: 16 },
  empty: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    gap: 8,
  },
  cardMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, minWidth: 0 },
  name: { color: colors.text, fontSize: 16, fontWeight: "600" },
  meta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});
