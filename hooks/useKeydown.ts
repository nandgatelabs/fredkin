import { useEffect } from "react";
import { Platform } from "react-native";

import { isTypingTarget } from "@/lib/keyboard";

type Handler = (event: KeyboardEvent) => void;

type Options = {
  /** Skip handler while focus is in an input/textarea (default false). */
  ignoreWhenTyping?: boolean;
};

/** Web-only window keydown listener. No-op on native. */
export function useKeydown(enabled: boolean, handler: Handler, options?: Options) {
  const ignoreWhenTyping = options?.ignoreWhenTyping ?? false;

  useEffect(() => {
    if (!enabled || Platform.OS !== "web") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (ignoreWhenTyping && isTypingTarget(event)) return;
      handler(event);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, handler, ignoreWhenTyping]);
}
