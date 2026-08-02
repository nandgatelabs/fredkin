import { useCallback } from "react";
import { Redirect, useFocusEffect } from "expo-router";

import { useDesktopViewStore } from "@/store/desktopView";

export default function CategoriesScreenWeb() {
  const openPane = useDesktopViewStore((s) => s.openPane);

  useFocusEffect(
    useCallback(() => {
      openPane("categories");
    }, [openPane]),
  );

  return <Redirect href="/" />;
}
