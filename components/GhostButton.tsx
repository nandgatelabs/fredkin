import { type ViewStyle } from "react-native";

import { Button } from "@/components/ui/Button";

type Props = {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
};

/** Outlined CTA used at list footers (e.g. + ADD NEW ACCOUNT). */
export function GhostButton({ label, onPress, style }: Props) {
  return <Button label={label} onPress={onPress} variant="secondary" style={style} />;
}
