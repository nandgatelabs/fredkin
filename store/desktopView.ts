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
        return {
          mode: parsed.mode,
          left: parsed.left,
          right: parsed.right,
          activeSide: parsed.activeSide === "right" ? "right" : "left",
        };
      }
    }
    // Migrate legacy key from earlier desktop view store.
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

type DesktopViewState = Persisted & {
  setMode: (mode: "single" | "split") => void;
  setLeft: (pane: PaneId) => void;
  setRight: (pane: PaneId) => void;
  setActiveSide: (side: "left" | "right") => void;
  /** Open a pane: single full-screen, or assign/focus in split. */
  openPane: (pane: PaneId) => void;
  enterSplit: () => void;
  maximize: (side: "left" | "right") => void;
};

const initial = readStored();

export const useDesktopViewStore = create<DesktopViewState>((set, get) => ({
  ...initial,

  setMode: (mode) => {
    const next = { ...get(), mode };
    persist(next);
    set({ mode });
  },

  setLeft: (left) => {
    const next = { ...get(), left };
    persist(next);
    set({ left });
  },

  setRight: (right) => {
    const next = { ...get(), right };
    persist(next);
    set({ right });
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
      // Not visible: put it on the active side (any pair).
      if (cur.activeSide === "left") {
        const next = { ...cur, left: pane };
        persist(next);
        set({ left: pane });
      } else {
        const next = { ...cur, right: pane };
        persist(next);
        set({ right: pane });
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
    let right = cur.right;
    if (right === cur.left) {
      right = cur.left === "events" ? "insights" : "events";
    }
    const next = {
      ...cur,
      mode: "split" as const,
      right,
      activeSide: "left" as const,
    };
    persist(next);
    set({ mode: "split", right, activeSide: "left" });
  },

  maximize: (side) => {
    const cur = get();
    const pane = side === "left" ? cur.left : cur.right;
    const next = { ...cur, mode: "single" as const, left: pane };
    persist(next);
    set({ mode: "single", left: pane });
  },
}));
