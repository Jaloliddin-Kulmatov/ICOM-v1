import React from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { WEB_URL } from "@/lib/config";
import { GUIDES, paragraphs } from "@/lib/guides";
import { useColors } from "@/lib/theme";
import { Button, Card, Empty, Screen, Text } from "@/components/ui";
import { useT } from "@/i18n";

export default function GuideScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const c = useColors();
  const { t } = useT();
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) return <Screen><Empty icon="book-outline" title={t("Guide not found")} /></Screen>;

  return (
    <Screen>
      <Stack.Screen options={{ title: guide.title }} />
      <Text variant="title">{guide.title}</Text>
      <Text variant="small">{t("Updated {date}. Rules change, so confirm with your international office or HiKorea (call 1345).", { date: guide.updated })}</Text>
      {guide.chunks.map((chunk, i) => (
        <Card key={i}>
          {paragraphs(chunk).map((p, j) => (
            <Text key={j} variant={p.endsWith("?") ? "heading" : "body"} style={p.endsWith("?") ? { color: c.accent } : undefined}>{p}</Text>
          ))}
        </Card>
      ))}
      <Button title={t("Open the full guide with links")} variant="secondary" icon="open-outline"
        onPress={() => WebBrowser.openBrowserAsync(`${WEB_URL}${guide.url}`)} />
    </Screen>
  );
}
