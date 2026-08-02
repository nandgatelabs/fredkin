import { useCallback, useDeferredValue, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { RecordDetailModal } from "@/components/RecordDetailModal";
import { SearchResultRow } from "@/components/SearchResultRow";
import {
  deleteRecord,
  searchRecords,
  type RecordListItem,
} from "@/db/records";
import { useKeydown } from "@/hooks/useKeydown";
import { webClickable, webFocusableProps } from "@/lib/web";
import { colors } from "@/theme";

type Props = {
  onClose: () => void;
  /** Tighter layout inside a centered dialog. */
  compact?: boolean;
};

/** Search field + results (screen or modal). */
export function SearchBody({ onClose, compact = false }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim());
  const [results, setResults] = useState<RecordListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<RecordListItem | null>(null);

  const leave = useCallback(() => {
    if (selected) setSelected(null);
    else onClose();
  }, [onClose, selected]);

  useKeydown(
    true,
    useCallback(
      (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          leave();
        }
      },
      [leave],
    ),
    { capture: true },
  );

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
    <View style={[styles.root, compact && styles.rootCompact]}>
      <View style={styles.searchRow}>
        <View style={styles.pill}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search events"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Search events"
            onKeyPress={(e) => {
              if (e.nativeEvent.key === "Escape") leave();
            }}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close search"
          onPress={onClose}
          hitSlop={10}
          style={webClickable}
          {...webFocusableProps}
        >
          <Text style={styles.cancel}>Close</Text>
        </Pressable>
      </View>

      {!deferred ? (
        <View style={[styles.empty, compact && styles.emptyCompact]}>
          <Ionicons
            name="document-text-outline"
            size={compact ? 40 : 48}
            color={colors.accentMuted}
          />
          <Text style={styles.hint}>
            Search events by notes, event type, or wallet name
          </Text>
          {Platform.OS === "web" ? (
            <Text style={styles.kbdHint}>Esc close · type to search</Text>
          ) : null}
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
            style={styles.listFlex}
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
          onClose();
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
  root: { flex: 1 },
  rootCompact: { minHeight: 0 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.inputBg,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 0,
    outlineStyle: "none",
  } as never,
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
    paddingBottom: 40,
  },
  emptyCompact: {
    paddingBottom: 16,
  },
  hint: {
    color: colors.accentMuted,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  kbdHint: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  count: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  listFlex: { flex: 1, minHeight: 0 },
  list: {
    paddingBottom: 16,
  },
  noMatches: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
  },
});
