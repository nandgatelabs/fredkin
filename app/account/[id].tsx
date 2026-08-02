import { useLocalSearchParams, useRouter } from "expo-router";

import { AccountDetailPane } from "@/components/account/AccountDetailPane";

export default function AccountDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  if (!id) return null;
  return <AccountDetailPane id={id} onClose={() => router.back()} />;
}
