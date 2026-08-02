import { useCallback, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { GlassAtmosphere } from "@/components/GlassAtmosphere";
import { PaneSlot } from "@/components/shell/PaneSlot";
import { SplitDivider } from "@/components/shell/SplitDivider";
import { useEffectiveDesktopLayout } from "@/hooks/useEffectiveDesktopView";
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

/** Web desktop home: single pane or any left|right pair. */
export function DesktopShell() {
  const layout = useEffectiveDesktopLayout();
  const setLeft = useDesktopViewStore((s) => s.setLeft);
  const setRight = useDesktopViewStore((s) => s.setRight);
  const setActiveSide = useDesktopViewStore((s) => s.setActiveSide);
  const maximize = useDesktopViewStore((s) => s.maximize);

  const [leftRatio, setLeftRatio] = useState(readRatio);
  const splitRef = useRef<View>(null);
  const splitLeftRef = useRef(0);
  const splitWidthRef = useRef(0);

  const measureSplit = useCallback(() => {
    const node = splitRef.current as unknown as {
      measureInWindow?: (
        cb: (x: number, y: number, w: number, h: number) => void,
      ) => void;
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
    setLeftRatio(Math.min(MAX_RATIO, Math.max(MIN_RATIO, next)));
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
      {layout.mode === "split" ? (
        <View ref={splitRef} style={styles.split} onLayout={measureSplit}>
          <View style={[styles.pane, { flexGrow: leftRatio, flexBasis: 0 }]}>
            <PaneSlot
              paneId={layout.left}
              active={layout.activeSide === "left"}
              splitChrome
              onFocus={() => setActiveSide("left")}
              onSelectPane={setLeft}
              onMaximize={() => maximize("left")}
            />
          </View>
          <SplitDivider onDrag={onDrag} onDragEnd={onDragEnd} />
          <View
            style={[styles.pane, { flexGrow: 1 - leftRatio, flexBasis: 0 }]}
          >
            <PaneSlot
              paneId={layout.right}
              active={layout.activeSide === "right"}
              splitChrome
              onFocus={() => setActiveSide("right")}
              onSelectPane={setRight}
              onMaximize={() => maximize("right")}
            />
          </View>
        </View>
      ) : (
        <PaneSlot
          paneId={layout.pane}
          onSelectPane={setLeft}
          splitChrome={false}
        />
      )}
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
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 0,
  },
  pane: {
    flexShrink: 1,
    minWidth: 0,
  },
});
