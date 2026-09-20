import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { ConfirmModal } from "@/components/ConfirmModal";
import { DisplayOptionsModal } from "@/components/DisplayOptionsModal";
import { EmptyTab } from "@/components/EmptyTab";
import { OccasionDetailModal } from "@/components/OccasionDetailModal";
import { OccasionRow } from "@/components/OccasionRow";
import { PeriodHeader } from "@/components/PeriodHeader";
import { RecordDetailModal } from "@/components/RecordDetailModal";
import { RecordRow } from "@/components/RecordRow";
import {
  attachRecordsToOccasion,
  detachRecordFromOccasion,
  listOccasionsInRange,
} from "@/db/occasions";
import {
  deleteRecord,
  getCarryOverBefore,
  getPeriodTotals,
  listRecordsInRange,
  type RecordListItem,
} from "@/db/records";
import type { Occasion } from "@/db/types";
import { hitOccasionDrop } from "@/lib/occasionDrop";
import { groupEventListRows, type EventListRow } from "@/lib/occasionsUi";
import { rangeForViewMode } from "@/lib/period";
import { recordTitle } from "@/lib/recordsUi";
import { usePeriodStore } from "@/store/period";
import { useSettingsStore } from "@/store/settings";
import { colors } from "@/theme";

type Props = {
  listBottomPad?: number;
  showPeriodNav?: boolean;
  showPeriodLabel?: boolean;
  showDisplayOptions?: boolean;
  onMaximize?: () => void;
};

export function EventsPane({
  listBottomPad = 24,
  showPeriodNav = true,
  showPeriodLabel = true,
  showDisplayOptions = true,
  onMaximize,
}: Props) {
  const router = useRouter();
  const anchorDate = usePeriodStore((s) => s.anchorDate);
  const viewMode = useSettingsStore((s) => s.viewMode);
  const carryOver = useSettingsStore((s) => s.carryOver);

  const [records, setRecords] = useState<RecordListItem[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [expense, setExpense] = useState(0);
  const [income, setIncome] = useState(0);
  const [carryAmount, setCarryAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayOpen, setDisplayOpen] = useState(false);
  const [selected, setSelected] = useState<RecordListItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RecordListItem | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [detailOccasionId, setDetailOccasionId] = useState<string | null>(null);
  const [drag, setDrag] = useState<{
    item: RecordListItem;
    x: number;
    y: number;
  } | null>(null);
  const [hoverOccasionId, setHoverOccasionId] = useState<string | null>(null);
  const paneRef = useRef<View>(null);
  const paneOrigin = useRef({ x: 0, y: 0 });
  const dropHosts = useRef(new Map<string, View>());
  const dragItemRef = useRef<RecordListItem | null>(null);

  const range = useMemo(
    () => rangeForViewMode(anchorDate, viewMode),
    [anchorDate, viewMode],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, occs, totals, carry] = await Promise.all([
        listRecordsInRange(range.start, range.end),
        listOccasionsInRange(range.start, range.end),
        getPeriodTotals(range.start, range.end),
        carryOver ? getCarryOverBefore(range.start) : Promise.resolve(0),
      ]);
      setRecords(list);
      setOccasions(occs);
      setExpense(totals.expense);
      setIncome(totals.income);
      setCarryAmount(carry);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [carryOver, range.end, range.start]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const sections = useMemo(
    () => groupEventListRows(records, occasions),
    [occasions, records],
  );
  const hasRows = sections.some((s) => s.data.length > 0);

  const editRecord = useCallback(
    (record: RecordListItem) => {
      setSelected(null);
      router.push({ pathname: "/record/new", params: { id: record.id } });
    },
    [router],
  );

  const nativeDrag = Platform.OS !== "web";

  const bindDropHost = useCallback((id: string) => {
    return (node: View | null) => {
      if (node) dropHosts.current.set(id, node);
      else dropHosts.current.delete(id);
    };
  }, []);

  const updateHover = useCallback((x: number, y: number) => {
    setHoverOccasionId(hitOccasionDrop(x, y, dropHosts.current));
  }, []);

  const onOccasionDragStart = useCallback(
    (item: RecordListItem) => (x: number, y: number) => {
      dragItemRef.current = item;
      paneRef.current?.measureInWindow((ox, oy) => {
        paneOrigin.current = { x: ox, y: oy };
      });
      setDrag({ item, x, y });
      updateHover(x, y);
    },
    [updateHover],
  );

  const onOccasionDragMove = useCallback(
    (x: number, y: number) => {
      setDrag((prev) => (prev ? { ...prev, x, y } : prev));
      updateHover(x, y);
    },
    [updateHover],
  );

  const onOccasionDragEnd = useCallback(
    async (x: number, y: number) => {
      const item = dragItemRef.current;
      const targetId = hitOccasionDrop(x, y, dropHosts.current);
      dragItemRef.current = null;
      setDrag(null);
      setHoverOccasionId(null);
      if (!item) return;
      try {
        if (targetId) {
          if (item.occasion_id === targetId) return;
          await attachRecordsToOccasion(targetId, [item.id]);
          setExpanded((prev) => new Set(prev).add(targetId));
          await reload();
          return;
        }
        if (item.occasion_id) {
          await detachRecordFromOccasion(item.id);
          await reload();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not move event");
      }
    },
    [reload],
  );

  const recordDragProps = useCallback(
    (item: RecordListItem) => {
      if (!nativeDrag) return {};
      return {
        dragging: drag?.item.id === item.id,
        onOccasionDragStart: onOccasionDragStart(item),
        onOccasionDragMove,
        onOccasionDragEnd,
      };
    },
    [drag?.item.id, nativeDrag, onOccasionDragEnd, onOccasionDragMove, onOccasionDragStart],
  );

  const confirmPendingDelete = useCallback(async () => {
    const record = pendingDelete;
    setPendingDelete(null);
    if (!record) return;
    try {
      await deleteRecord(record.id);
      setSelected(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }, [pendingDelete, reload]);

  function renderEventRow(row: EventListRow) {
    if (row.kind === "record") {
      const item = row.item;
      return (
        <RecordRow
          item={item}
          onPress={() => {
            if (dragItemRef.current) return;
            setSelected(item);
          }}
          onEdit={() => editRecord(item)}
          onDelete={() => setPendingDelete(item)}
          {...recordDragProps(item)}
        />
      );
    }
    const open = expanded.has(row.occasion.id);
    return (
      <View ref={bindDropHost(row.occasion.id)} collapsable={false}>
        <OccasionRow
          row={row}
          expanded={open}
          dropHighlight={hoverOccasionId === row.occasion.id}
          onToggle={() => {
            setExpanded((prev) => {
              const next = new Set(prev);
              if (next.has(row.occasion.id)) next.delete(row.occasion.id);
              else next.add(row.occasion.id);
              return next;
            });
          }}
          onOpen={() => setDetailOccasionId(row.occasion.id)}
        />
        {open
          ? row.members.map((item) => (
              <RecordRow
                key={item.id}
                item={item}
                nested
                hideOccasion
                onPress={() => {
                  if (dragItemRef.current) return;
                  setSelected(item);
                }}
                onEdit={() => editRecord(item)}
                onDelete={() => setPendingDelete(item)}
                {...recordDragProps(item)}
              />
            ))
          : null}
      </View>
    );
  }

  return (
    <View ref={paneRef} style={styles.root}>
      <PeriodHeader
        expense={expense}
        income={income}
        carryAmount={carryAmount}
        showPeriodNav={showPeriodNav}
        showPeriodLabel={showPeriodLabel}
        onMaximize={onMaximize}
        onFilterPress={
          showDisplayOptions ? () => setDisplayOpen(true) : undefined
        }
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && !hasRows ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : !hasRows ? (
        <EmptyTab
          title="No events yet"
          subtitle="Tap + to add a spend, income, or transfer. Occasions are optional — long-press + on the phone, or the circled + on web."
        />
      ) : (
        <SectionList
          sections={sections}
          extraData={{ expanded, hoverOccasionId, dragId: drag?.item.id }}
          scrollEnabled={!drag}
          keyExtractor={(item) =>
            item.kind === "record" ? item.item.id : `occ:${item.occasion.id}`
          }
          stickySectionHeadersEnabled={false}
          contentContainerStyle={[styles.list, { paddingBottom: listBottomPad }]}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionLine} />
            </View>
          )}
          renderItem={({ item }) => renderEventRow(item)}
        />
      )}

      {showDisplayOptions ? (
        <DisplayOptionsModal
          visible={displayOpen}
          onClose={() => {
            setDisplayOpen(false);
            void reload();
          }}
        />
      ) : null}

      <RecordDetailModal
        record={selected}
        onClose={() => setSelected(null)}
        onEdit={editRecord}
        onDelete={(record) => {
          setSelected(null);
          setPendingDelete(record);
        }}
        onAddToOccasion={(record) => {
          setSelected(null);
          router.push({
            pathname: "/occasion/new",
            params: { group: "1", recordIds: record.id },
          });
        }}
        onRemoveFromOccasion={(record) => {
          setSelected(null);
          void detachRecordFromOccasion(record.id).then(reload);
        }}
      />

      <OccasionDetailModal
        occasionId={detailOccasionId}
        onClose={() => setDetailOccasionId(null)}
        onChanged={() => void reload()}
        onAddEvent={(occasion) => {
          router.push({
            pathname: "/record/new",
            params: { occasionId: occasion.id },
          });
        }}
        onGroupExisting={(occasion) => {
          router.push({
            pathname: "/occasion/new",
            params: { group: "1", attachTo: occasion.id },
          });
        }}
        onRename={(occasion) => {
          setDetailOccasionId(null);
          router.push({
            pathname: "/occasion/new",
            params: { id: occasion.id },
          });
        }}
      />

      {drag ? (
        <View
          pointerEvents="none"
          style={[
            styles.ghost,
            {
              left: drag.x - paneOrigin.current.x - 16,
              top: drag.y - paneOrigin.current.y - 24,
            },
          ]}
        >
          <Text style={styles.ghostText} numberOfLines={1}>
            {recordTitle(drag.item)}
          </Text>
        </View>
      ) : null}

      <ConfirmModal
        visible={pendingDelete != null}
        title="Delete record?"
        message="This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmPendingDelete()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: {},
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  sectionTitle: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  sectionLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  error: {
    color: colors.danger,
    paddingHorizontal: 16,
    marginBottom: 8,
    fontSize: 13,
  },
  ghost: {
    position: "absolute",
    zIndex: 40,
    maxWidth: 220,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  ghostText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
});
