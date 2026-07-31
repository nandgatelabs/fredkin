import { useEffect } from "react";
import { Platform } from "react-native";

type Handler = (event: KeyboardEvent) => void;

/** Web-only window keydown listener. No-op on native. */
export function useKeydown(enabled: boolean, handler: Handler) {
  useEffect(() => {
    if (!enabled || Platform.OS !== "web") return;

    const onKeyDown = (event: KeyboardEvent) => {
      handler(event);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, handler]);
}
