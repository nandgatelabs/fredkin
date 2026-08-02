import { useLocalSearchParams, useRouter } from "expo-router";

import { CategoryDetailPane } from "@/components/category/CategoryDetailPane";

export default function CategoryDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  if (!id) return null;
  return <CategoryDetailPane id={id} onClose={() => router.back()} />;
}
