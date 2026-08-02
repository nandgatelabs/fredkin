import { useCallback, useEffect, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { colors } from "@/theme";

type Props = {
  /** Called with clientX while dragging. */
  onDrag: (clientX: number) => void;
  onDragEnd?: () => void;
};

/**
 * Draggable vertical gutter between Events and Insights (web).
 */
export function SplitDivider({ onDrag, onDragEnd }: Props) {
  const dragging = useRef(false);

  const onMove = useCallback(
    (event: PointerEvent) => {
      if (!dragging.current) return;
      onDrag(event.clientX);
    },
    [onDrag],
  );

  const onUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    onDragEnd?.();
  }, [onDragEnd]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [onMove, onUp]);

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel="Resize Events and Insights panes"
      style={[styles.hit, Platform.OS === "web" ? styles.webHit : null]}
      onStartShouldSetResponder={() => true}
      onResponderGrant={() => {
        dragging.current = true;
      }}
      onResponderRelease={() => {
        dragging.current = false;
        onDragEnd?.();
      }}
      {...(Platform.OS === "web"
        ? {
            onPointerDown: (e: { nativeEvent: { clientX: number } }) => {
              dragging.current = true;
              onDrag(e.nativeEvent.clientX);
            },
          }
        : {})}
    >
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: 10,
    marginHorizontal: -3,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  webHit: {
    // RN web accepts CSS cursor values at runtime.
    cursor: "col-resize" as never,
  },
  line: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    flexGrow: 1,
    marginVertical: 8,
    backgroundColor: colors.border,
  },
});
