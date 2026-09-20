import type { View } from "react-native";

/** Native window hit-test for occasion drop targets. Relies on measureInWindow being sync. */
export function hitOccasionDrop(
  x: number,
  y: number,
  hosts: Map<string, View>,
): string | null {
  let hit: string | null = null;
  hosts.forEach((view, id) => {
    view.measureInWindow((vx, vy, vw, vh) => {
      if (vw <= 0 || vh <= 0) return;
      if (x >= vx && x <= vx + vw && y >= vy && y <= vy + vh) hit = id;
    });
  });
  return hit;
}
