import { Linking, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WebCenterFrame } from "@/components/shell/WebCenterFrame";
import { WebDialogHeader } from "@/components/shell/WebDialogHeader";
import { log } from "@/lib/logger";
import { webClickable, webFocusableProps } from "@/lib/web";
import { colors } from "@/theme";

const REPO = "https://github.com/nandgatelabs/fredkin";

const LINKS: { label: string; description: string; url: string }[] = [
  {
    label: "Report an issue",
    description: "Bugs and feature requests on GitHub Issues",
    url: `${REPO}/issues`,
  },
  {
    label: "Discussions",
    description: "Questions and feedback (GitHub Discussions)",
    url: `${REPO}/discussions`,
  },
  {
    label: "Contributing",
    description: "How to propose changes",
    url: `${REPO}/blob/main/CONTRIBUTING.md`,
  },
  {
    label: "Security",
    description: "How to report a vulnerability privately",
    url: `${REPO}/blob/main/SECURITY.md`,
  },
  {
    label: "Source code",
    description: "nandgatelabs/fredkin on GitHub",
    url: REPO,
  },
];

async function openUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch (e) {
    log.warn("openURL failed", { url, e });
  }
}

export default function HelpScreen() {
  const insets = useSafeAreaInsets();

  return (
    <WebCenterFrame>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 20,
        }}
      >
        <WebDialogHeader title="Support" />

        <Text style={styles.body}>
          Fredkin by NandGateLabs is offline, local-first, and free of paywalls or
          analytics. Use these links for help — nothing here phones home.
        </Text>

        {LINKS.map((item) => (
          <Pressable
            key={item.url}
            accessibilityRole="link"
            accessibilityLabel={item.label}
            onPress={() => void openUrl(item.url)}
            style={[styles.row, webClickable]}
            {...webFocusableProps}
          >
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowDesc}>{item.description}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </WebCenterFrame>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  row: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  rowLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  rowDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
});
