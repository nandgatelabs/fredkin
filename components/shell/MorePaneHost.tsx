import { MorePane } from "@/components/MorePane";
import { useMorePaneStore } from "@/store/morePane";

/** Mount once near the app root so native edge + web header share one drawer. */
export function MorePaneHost() {
  const open = useMorePaneStore((s) => s.open);
  const closeMore = useMorePaneStore((s) => s.closeMore);
  return <MorePane visible={open} onClose={closeMore} />;
}
