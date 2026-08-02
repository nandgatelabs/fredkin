import { Platform } from "react-native";

import { SearchModal } from "@/components/shell/SearchModal";
import { useSearchModalStore } from "@/store/searchModal";

/** Web search dialog host (native uses the /search route). */
export function SearchModalHost() {
  const open = useSearchModalStore((s) => s.open);
  const closeSearch = useSearchModalStore((s) => s.closeSearch);
  if (Platform.OS !== "web") return null;
  return <SearchModal visible={open} onClose={closeSearch} />;
}
