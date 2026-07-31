import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

import { ActionMenu } from "@/components/ActionMenu";
import { AppHeader } from "@/components/AppHeader";
import { Fab } from "@/components/Fab";
import { GhostButton } from "@/components/GhostButton";
import { NameEditorModal } from "@/components/NameEditorModal";
import { TotalsHeader } from "@/components/TotalsHeader";
import { getLifetimeTotals } from "@/db/accounts";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@/db/categories";
import type { Category, CategoryType, Totals } from "@/db/types";
import { categoryIcon } from "@/lib/icons";
import { colors } from "@/theme";

type Section = { title: string; type: CategoryType; data: Category[] };

export default function CategoriesScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuCategory, setMenuCategory] = useState<Category | null>(null);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [editor, setEditor] = useState<
    | { mode: "create"; type: CategoryType }
    | { mode: "edit"; category: Category }
    | null
  >(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [all, lifetime] = await Promise.all([listCategories(), getLifetimeTotals()]);
      setSections([
        {
          title: "Income categories",
          type: "income",
          data: all.filter((c) => c.type === "income"),
        },
        {
          title: "Expense categories",
          type: "expense",
          data: all.filter((c) => c.type === "expense"),
        },
      ]);
      setTotals(lifetime);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load categories");
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

      {loading && sections.length === 0 ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.section}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View
                style={[
                  styles.icon,
                  { backgroundColor: item.color ?? colors.border },
                ]}
              >
                <Ionicons name={categoryIcon(item.icon_key)} size={18} color="#fff" />
              </View>
              <Text style={styles.name}>{item.name}</Text>
              <Pressable onPress={() => setMenuCategory(item)} hitSlop={10}>
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.accentMuted} />
              </Pressable>
            </View>
          )}
          ListFooterComponent={
            <GhostButton
              label="+ ADD NEW CATEGORY"
              onPress={() => setTypePickerOpen(true)}
              style={{ marginTop: 16 }}
            />
          }
        />
      )}

      <Fab />

      <ActionMenu
        visible={typePickerOpen}
        title="Add category"
        onClose={() => setTypePickerOpen(false)}
        items={[
          {
            label: "Income",
            onPress: () => setEditor({ mode: "create", type: "income" }),
          },
          {
            label: "Expense",
            onPress: () => setEditor({ mode: "create", type: "expense" }),
          },
        ]}
      />

      <ActionMenu
        visible={menuCategory != null}
        title={menuCategory?.name}
        onClose={() => setMenuCategory(null)}
        items={[
          {
            label: "Rename",
            onPress: () => {
              if (menuCategory) setEditor({ mode: "edit", category: menuCategory });
            },
          },
          {
            label: "Delete",
            destructive: true,
            onPress: () => {
              if (!menuCategory) return;
              void deleteCategory(menuCategory.id)
                .then(reload)
                .catch((e) =>
                  setError(e instanceof Error ? e.message : "Delete failed"),
                );
            },
          },
        ]}
      />

      <NameEditorModal
        visible={editor != null}
        title={
          editor?.mode === "edit"
            ? "Rename category"
            : editor?.type === "income"
              ? "New income category"
              : "New expense category"
        }
        initialName={editor?.mode === "edit" ? editor.category.name : ""}
        onCancel={() => setEditor(null)}
        onConfirm={async (name) => {
          if (editor?.mode === "edit") {
            await updateCategory(editor.category.id, { name });
          } else if (editor?.mode === "create") {
            await createCategory({ name, type: editor.type });
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
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  section: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { flex: 1, color: colors.text, fontSize: 16 },
  error: {
    color: colors.danger,
    paddingHorizontal: 16,
    marginBottom: 8,
    fontSize: 13,
  },
});
