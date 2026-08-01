import { StyleSheet, Text, type TextStyle } from "react-native";

import { colors } from "@/theme";

type Props = {
  text: string;
  query: string;
  style?: TextStyle;
  numberOfLines?: number;
};

/** Renders `text` with case-insensitive `query` spans highlighted. */
export function HighlightedText({ text, query, style, numberOfLines }: Props) {
  const q = query.trim();
  if (!q) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  const parts = splitHighlight(text, q);
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, i) =>
        part.hit ? (
          <Text key={i} style={styles.hit}>
            {part.value}
          </Text>
        ) : (
          <Text key={i}>{part.value}</Text>
        ),
      )}
    </Text>
  );
}

function splitHighlight(text: string, query: string): { value: string; hit: boolean }[] {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${escaped})`, "ig");
  const chunks = text.split(re);
  const lower = query.toLowerCase();
  return chunks
    .filter((c) => c.length > 0)
    .map((value) => ({ value, hit: value.toLowerCase() === lower }));
}

const styles = StyleSheet.create({
  hit: {
    backgroundColor: colors.accentSoft,
    color: colors.text,
    fontWeight: "700",
  },
});
