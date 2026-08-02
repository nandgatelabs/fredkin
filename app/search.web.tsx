import { useEffect } from "react";
import { Redirect } from "expo-router";

import { useSearchModalStore } from "@/store/searchModal";

/** Web: bounce /search into the centered search dialog over the shell. */
export default function SearchScreenWeb() {
  const openSearch = useSearchModalStore((s) => s.openSearch);

  useEffect(() => {
    openSearch();
  }, [openSearch]);

  return <Redirect href="/" />;
}
