import { useCallback, useDeferredValue, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RecordDetailModal } from "@/components/RecordDetailModal";
import { SearchResultRow } from "@/components/SearchResultRow";
import { Button } from "@/components/ui/Button";
import {
  deleteRecord,
  searchRecords,
  type RecordListItem,
} from "@/db/records";
import { webClickable } from "@/lib/web";
import { colors } from "@/theme";

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim());
  const [results, setResults] = useState<RecordListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<RecordListItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!deferred) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    searchRecords(deferred)
      .then((rows) => {
        if (!cancelled) setResults(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [deferred]);

  const reload = useCallback(() => {
    if (!deferred) {
      setResults([]);
      return;
    }
    void searchRecords(deferred).then(setResults);
  }, [deferred]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.accentMuted} />
        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder="Search for records"
          placeholderTextColor={colors.accentMuted}
          style={styles.input}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        <Pressable onPress={() => router.back()} hitSlop={10} style={webClickable}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
      </View>

      {!deferred ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={48} color={colors.accentMuted} />
          <Text style={styles.hint}>
            Search records by notes, category name or account name
          </Text>
          <Button
            label="IMPORT CSV"
            variant="secondary"
            onPress={() => router.push("/import-csv" as never)}
            style={styles.importBtn}
          />
        </View>
      ) : loading && results.length === 0 ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <>
          <Text style={styles.count}>
            Total {results.length}
            {results.length >= 500 ? "+" : ""} matches found
          </Text>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.noMatches}>No matches for “{deferred}”</Text>
            }
            renderItem={({ item }) => (
              <SearchResultRow
                item={item}
                query={deferred}
                onPress={() => setSelected(item)}
              />
            )}
          />
        </>
      )}

      <RecordDetailModal
        record={selected}
        onClose={() => setSelected(null)}
        onEdit={(record) => {
          setSelected(null);
          router.push({ pathname: "/record/new", params: { id: record.id } });
        }}
        onDelete={(record) => {
          void deleteRecord(record.id).then(() => {
            setSelected(null);
            reload();
          });
        }}
      />
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
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.inputBg,
    marginBottom: 12,
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
    fontWeight: "600",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  hint: {
    color: colors.accentMuted,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  importBtn: {
    marginTop: 8,
    minWidth: 180,
  },
  count: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  list: {
    paddingBottom: 40,
  },
  noMatches: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
  },
});
