import { useCallback, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { AppHeader } from "@/components/AppHeader";
import { GlassAtmosphere } from "@/components/GlassAtmosphere";
import { EventsPane } from "@/components/events/EventsPane";
import { InsightsPane } from "@/components/insights/InsightsPane";
import { SplitDivider } from "@/components/shell/SplitDivider";
import { useDesktopViewStore } from "@/store/desktopView";
import { colors } from "@/theme";

const RATIO_KEY = "fredkin.splitRatio";
const MIN_RATIO = 0.28;
const MAX_RATIO = 0.72;

function readRatio() {
  if (typeof window === "undefined") return 0.5;
  try {
    const raw = window.localStorage.getItem(RATIO_KEY);
    const n = raw == null ? NaN : Number(raw);
    if (Number.isFinite(n) && n >= MIN_RATIO && n <= MAX_RATIO) return n;
  } catch {
    /* ignore */
  }
  return 0.5;
}

function persistRatio(ratio: number) {
  try {
    window.localStorage.setItem(RATIO_KEY, String(ratio));
  } catch {
    /* ignore */
  }
}

/**
 * Web desktop split: Events | Insights.
 * Primary nav lives in the header; period chip syncs both panes.
 */
export function DesktopSplitHome() {
  const router = useRouter();
  const setView = useDesktopViewStore((s) => s.setView);
  const [leftRatio, setLeftRatio] = useState(readRatio);
  const splitRef = useRef<View>(null);
  const splitLeftRef = useRef(0);
  const splitWidthRef = useRef(0);

  const measureSplit = useCallback(() => {
    const node = splitRef.current as unknown as {
      measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void;
    } | null;
    node?.measureInWindow?.((x, _y, w) => {
      splitLeftRef.current = x;
      splitWidthRef.current = w;
    });
  }, []);

  const onDrag = useCallback((clientX: number) => {
    const width = splitWidthRef.current;
    if (width <= 0) return;
    const next = (clientX - splitLeftRef.current) / width;
    const clamped = Math.min(MAX_RATIO, Math.max(MIN_RATIO, next));
    setLeftRatio(clamped);
  }, []);

  const onDragEnd = useCallback(() => {
    setLeftRatio((r) => {
      persistRatio(r);
      return r;
    });
  }, []);

  return (
    <View style={styles.root}>
      <GlassAtmosphere />
      <AppHeader />
      <View
        ref={splitRef}
        style={styles.split}
        onLayout={measureSplit}
      >
        <View style={[styles.pane, { flexGrow: leftRatio, flexBasis: 0 }]}>
          <EventsPane
            listBottomPad={24}
            showPeriodNav={false}
            onMaximize={() => setView("events")}
          />
        </View>
        <SplitDivider onDrag={onDrag} onDragEnd={onDragEnd} />
        <View style={[styles.pane, { flexGrow: 1 - leftRatio, flexBasis: 0 }]}>
          <InsightsPane
            showDisplayOptions
            contentBottomPad={40}
            onMaximize={() => {
              setView("insights");
              router.navigate("/analysis");
            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  split: {
    flex: 1,
    flexDirection: "row",
    minHeight: 0,
  },
  pane: {
    flexShrink: 1,
    minWidth: 0,
  },
});
