import React, { useState } from "react";
import { FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { useApi } from "@/hooks/use-api";
import { timeAgo } from "@/lib/options";
import { space, useColors } from "@/lib/theme";
import type { ChatPost } from "@/lib/types";
import { Button, Card, Chip, ChipRow, Empty, ErrorBox, Loading, Row, Text } from "@/components/ui";

type Tab = "all" | "unanswered";

export default function ChatTab() {
  const c = useColors();
  const { data, loading, refreshing, error, reload, pull } = useApi<{ posts: ChatPost[] }>("/chat/posts");
  const posts = data?.posts || [];
  const [tab, setTab] = useState<Tab>("all");
  useFocusEffect(reload);   // new answers since last visit

  const list = tab === "unanswered" ? posts.filter((p) => !p.answer_count) : posts;

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        data={list}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xxl }}
        refreshing={refreshing}
        onRefresh={pull}
        ListHeaderComponent={
          <View style={{ gap: space.sm, marginBottom: space.sm }}>
            <Button title="Ask a question" icon="add-circle-outline" onPress={() => router.push("/chat/new")} />
            <ChipRow>
              <Chip label="All questions" selected={tab === "all"} onPress={() => setTab("all")} />
              <Chip label="Unanswered" selected={tab === "unanswered"} onPress={() => setTab("unanswered")} />
            </ChipRow>
            {error ? <ErrorBox message={error} onRetry={reload} /> : null}
          </View>
        }
        ListEmptyComponent={loading ? <Loading /> : <Empty icon="chatbox-ellipses-outline" title="No questions yet" body="Ask the first one. Students across Korea answer." />}
        renderItem={({ item: p }) => (
          <Card onPress={() => router.push(`/chat/${p.id}`)} accessibilityLabel={p.title}>
            <Text variant="heading" numberOfLines={2}>{p.title}</Text>
            <Text variant="small" numberOfLines={2} color="muted">{p.content}</Text>
            <Row style={{ flexWrap: "wrap" }} gap={6}>
              {p.solved ? <Chip label="Solved" tone="good" icon="checkmark-circle-outline" />
                : <Chip label={`${p.answer_count} answer${p.answer_count === 1 ? "" : "s"}`} tone={p.answer_count ? "teal" : "muted"} />}
              {p.scope ? <Chip label="My campus" /> : null}
              <Text variant="small">{p.author_name} · {timeAgo(p.created_at)}</Text>
            </Row>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
