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
import { useFocusEffect, useRouter } from "expo-router";

import { ActionMenu } from "@/components/ActionMenu";
import { AppHeader } from "@/components/AppHeader";
import { CategoryEditorModal } from "@/components/CategoryEditorModal";
import { Fab } from "@/components/Fab";
import { GhostButton } from "@/components/GhostButton";
import { GlassAtmosphere } from "@/components/GlassAtmosphere";
import { TotalsHeader } from "@/components/TotalsHeader";
import { getLifetimeTotals } from "@/db/accounts";
import {
  createCategory,
  deleteCategory,
  ignoreCategory,
  listCategories,
  updateCategory,
} from "@/db/categories";
import type { Category, CategoryType, Totals } from "@/db/types";
import { categoryIcon } from "@/lib/icons";
import { colors } from "@/theme";

type Section = { title: string; type: CategoryType; data: Category[] };

export default function CategoriesScreen() {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuCategory, setMenuCategory] = useState<Category | null>(null);
  const [editor, setEditor] = useState<
    | { mode: "create" }
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
          title: "Income event types",
          type: "income",
          data: all.filter((c) => c.type === "income"),
        },
        {
          title: "Spend event types",
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
      <GlassAtmosphere />
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.name} details`}
                onPress={() => router.push(`/category/${item.id}` as never)}
                style={({ pressed }) => [styles.rowMain, pressed && styles.rowPressed]}
              >
                <View
                  style={[
                    styles.icon,
                    { backgroundColor: item.color ?? colors.border },
                  ]}
                >
                  <Ionicons name={categoryIcon(item.icon_key)} size={18} color="#fff" />
                </View>
                <Text style={styles.name}>{item.name}</Text>
              </Pressable>
              <Pressable
                onPress={() => setMenuCategory(item)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`${item.name} menu`}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.accentMuted} />
              </Pressable>
            </View>
          )}
          ListFooterComponent={
            <GhostButton
              label="+ ADD EVENT TYPE"
              onPress={() => setEditor({ mode: "create" })}
              style={{ marginTop: 16 }}
            />
          }
        />
      )}

      <Fab />

      <ActionMenu
        visible={menuCategory != null}
        title={menuCategory?.name}
        onClose={() => setMenuCategory(null)}
        items={[
          {
            label: "Edit",
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
          {
            label: "Ignore",
            onPress: () => {
              if (!menuCategory) return;
              void ignoreCategory(menuCategory.id)
                .then(reload)
                .catch((e) =>
                  setError(e instanceof Error ? e.message : "Ignore failed"),
                );
            },
          },
        ]}
      />

      <CategoryEditorModal
        visible={editor != null}
        mode={editor?.mode === "edit" ? "edit" : "create"}
        initial={
          editor?.mode === "edit"
            ? {
                name: editor.category.name,
                type: editor.category.type,
                icon_key: editor.category.icon_key,
                color: editor.category.color ?? undefined,
              }
            : undefined
        }
        onCancel={() => setEditor(null)}
        onSave={async (values) => {
          if (editor?.mode === "edit") {
            await updateCategory(editor.category.id, {
              name: values.name,
              icon_key: values.icon_key,
              color: values.color,
            });
          } else {
            await createCategory(values);
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
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  rowPressed: { opacity: 0.9 },
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
