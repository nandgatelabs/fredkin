import { useLocalSearchParams, useRouter } from "expo-router";

import { PersonDetailPane } from "@/components/people/PersonDetailPane";

export default function PersonDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  if (!id) return null;
  return <PersonDetailPane id={id} onClose={() => router.back()} />;
}
