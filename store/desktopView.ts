import { create } from "zustand";

/** Surfaces that can fill a desktop pane. */
export type PaneId = "events" | "insights" | "wallets" | "categories";

export const PANE_LABELS: Record<PaneId, string> = {
  events: "Events",
  insights: "Insights",
  wallets: "Wallets",
  categories: "Types",
};

export const ALL_PANES: PaneId[] = [
  "events",
  "insights",
  "wallets",
  "categories",
];

const STORAGE_KEY = "fredkin.desktopShell";

type Persisted = {
  mode: "single" | "split";
  left: PaneId;
  right: PaneId;
  activeSide: "left" | "right";
  /** Last split pair to restore when re-entering split. */
  lastSplitLeft: PaneId;
  lastSplitRight: PaneId;
};

function isPaneId(v: unknown): v is PaneId {
  return (
    v === "events" ||
    v === "insights" ||
    v === "wallets" ||
    v === "categories"
  );
}

function readStored(): Persisted {
  const fallback: Persisted = {
    mode: "split",
    left: "events",
    right: "insights",
    activeSide: "left",
    lastSplitLeft: "events",
    lastSplitRight: "insights",
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Persisted>;
      if (
        (parsed.mode === "single" || parsed.mode === "split") &&
        isPaneId(parsed.left) &&
        isPaneId(parsed.right)
      ) {
        const lastSplitLeft = isPaneId(parsed.lastSplitLeft)
          ? parsed.lastSplitLeft
          : parsed.mode === "split"
            ? parsed.left
            : "events";
        let lastSplitRight = isPaneId(parsed.lastSplitRight)
          ? parsed.lastSplitRight
          : parsed.mode === "split"
            ? parsed.right
            : "insights";
        if (lastSplitRight === lastSplitLeft) {
          lastSplitRight =
            lastSplitLeft === "events" ? "insights" : "events";
        }
        return {
          mode: parsed.mode,
          left: parsed.left,
          right: parsed.right,
          activeSide: parsed.activeSide === "right" ? "right" : "left",
          lastSplitLeft,
          lastSplitRight,
        };
      }
    }
    const legacy = window.localStorage.getItem("fredkin.desktopView");
    if (legacy === "split") return fallback;
    if (legacy === "events")
      return { ...fallback, mode: "single", left: "events" };
    if (legacy === "insights")
      return { ...fallback, mode: "single", left: "insights" };
  } catch {
    /* ignore */
  }
  return fallback;
}

function persist(state: Persisted) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function withLastSplit(
  state: Persisted,
  left: PaneId,
  right: PaneId,
): Persisted {
  if (left === right) return state;
  return { ...state, lastSplitLeft: left, lastSplitRight: right };
}

type DesktopViewState = Persisted & {
  setMode: (mode: "single" | "split") => void;
  setLeft: (pane: PaneId) => void;
  setRight: (pane: PaneId) => void;
  setActiveSide: (side: "left" | "right") => void;
  openPane: (pane: PaneId) => void;
  enterSplit: () => void;
  maximize: (side: "left" | "right") => void;
};

const initial = readStored();

export const useDesktopViewStore = create<DesktopViewState>((set, get) => ({
  ...initial,

  setMode: (mode) => {
    const cur = get();
    if (mode === "split") {
      get().enterSplit();
      return;
    }
    const next = { ...cur, mode };
    persist(next);
    set({ mode });
  },

  setLeft: (left) => {
    const cur = get();
    const next = withLastSplit(
      { ...cur, left },
      left,
      cur.mode === "split" ? cur.right : cur.lastSplitRight,
    );
    if (cur.mode !== "split") {
      const single = { ...cur, left };
      persist(single);
      set({ left });
      return;
    }
    persist(next);
    set({
      left,
      lastSplitLeft: next.lastSplitLeft,
      lastSplitRight: next.lastSplitRight,
    });
  },

  setRight: (right) => {
    const cur = get();
    if (cur.mode !== "split") {
      const next = { ...cur, right };
      persist(next);
      set({ right });
      return;
    }
    const next = withLastSplit({ ...cur, right }, cur.left, right);
    persist(next);
    set({
      right,
      lastSplitLeft: next.lastSplitLeft,
      lastSplitRight: next.lastSplitRight,
    });
  },

  setActiveSide: (activeSide) => {
    const next = { ...get(), activeSide };
    persist(next);
    set({ activeSide });
  },

  openPane: (pane) => {
    const cur = get();
    if (cur.mode === "split") {
      if (cur.left === pane) {
        const next = { ...cur, activeSide: "left" as const };
        persist(next);
        set({ activeSide: "left" });
        return;
      }
      if (cur.right === pane) {
        const next = { ...cur, activeSide: "right" as const };
        persist(next);
        set({ activeSide: "right" });
        return;
      }
      if (cur.activeSide === "left") {
        const next = withLastSplit({ ...cur, left: pane }, pane, cur.right);
        persist(next);
        set({
          left: pane,
          lastSplitLeft: next.lastSplitLeft,
          lastSplitRight: next.lastSplitRight,
        });
      } else {
        const next = withLastSplit({ ...cur, right: pane }, cur.left, pane);
        persist(next);
        set({
          right: pane,
          lastSplitLeft: next.lastSplitLeft,
          lastSplitRight: next.lastSplitRight,
        });
      }
      return;
    }

    if (cur.left === pane) return;
    const next = { ...cur, left: pane, mode: "single" as const };
    persist(next);
    set({ left: pane, mode: "single" });
  },

  enterSplit: () => {
    const cur = get();
    let left = cur.lastSplitLeft;
    let right = cur.lastSplitRight;
    if (left === right) {
      right = left === "events" ? "insights" : "events";
    }
    const next = {
      ...cur,
      mode: "split" as const,
      left,
      right,
      activeSide: "left" as const,
      lastSplitLeft: left,
      lastSplitRight: right,
    };
    persist(next);
    set({
      mode: "split",
      left,
      right,
      activeSide: "left",
      lastSplitLeft: left,
      lastSplitRight: right,
    });
  },

  maximize: (side) => {
    const cur = get();
    const pane = side === "left" ? cur.left : cur.right;
    const remembered = withLastSplit(cur, cur.left, cur.right);
    const next = {
      ...remembered,
      mode: "single" as const,
      left: pane,
    };
    persist(next);
    set({
      mode: "single",
      left: pane,
      lastSplitLeft: next.lastSplitLeft,
      lastSplitRight: next.lastSplitRight,
    });
  },
}));
