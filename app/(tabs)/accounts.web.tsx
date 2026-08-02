import { useCallback } from "react";
import { Redirect, useFocusEffect } from "expo-router";

import { useDesktopViewStore } from "@/store/desktopView";

export default function AccountsScreenWeb() {
  const openPane = useDesktopViewStore((s) => s.openPane);

  useFocusEffect(
    useCallback(() => {
      openPane("wallets");
    }, [openPane]),
  );

  return <Redirect href="/" />;
}
