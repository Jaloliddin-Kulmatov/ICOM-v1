import React, { useState } from "react";
import { FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/options";
import { space, useColors } from "@/lib/theme";
import type { ChatPost } from "@/lib/types";
import { Button, Card, Chip, ChipRow, Empty, ErrorBox, Loading, Row, Segmented, Text } from "@/components/ui";
import { useT } from "@/i18n";

// "all" = questions for every student in Korea; "campus" = questions only my
// university can see (the server already hides other campuses' posts).
export type Audience = "all" | "campus";

export default function ChatTab() {
  const c = useColors();
  const { t, tn } = useT();
  const { user } = useAuth();
  const uni = (user?.university || "").toUpperCase();
  const { data, loading, refreshing, error, reload, pull } = useApi<{ posts: ChatPost[] }>("/chat/posts");
  const posts = data?.posts || [];
  const [audience, setAudience] = useState<Audience>("all");
  const [unanswered, setUnanswered] = useState(false);
  useFocusEffect(reload);   // new answers since last visit

  const list = posts
    .filter((p) => (audience === "campus" ? !!p.scope : !p.scope))
    .filter((p) => !unanswered || !p.answer_count);

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
            {uni ? (
              <Segmented<Audience> value={audience} onChange={setAudience} options={[
                { value: "all", label: t("All students"), icon: "earth-outline" },
                { value: "campus", label: t("{uni} only", { uni }), icon: "school-outline" },
              ]} />
            ) : null}
            <Button title={audience === "campus" ? t("Ask {uni} students", { uni }) : t("Ask all students")} icon="add-circle-outline"
              onPress={() => router.push(`/chat/new?to=${audience}`)} />
            <ChipRow>
              <Chip label={t("All questions")} selected={!unanswered} onPress={() => setUnanswered(false)} />
              <Chip label={t("Unanswered")} selected={unanswered} onPress={() => setUnanswered(true)} />
            </ChipRow>
            {error ? <ErrorBox message={error} onRetry={reload} /> : null}
          </View>
        }
        ListEmptyComponent={loading ? <Loading /> : (
          <Empty icon="chatbox-ellipses-outline" title={t("No questions yet")}
            body={audience === "campus" ? t("Ask the first one. Only {uni} students will see it.", { uni }) : t("Ask the first one. Students across Korea answer.")} />
        )}
        renderItem={({ item: p }) => (
          <Card onPress={() => router.push(`/chat/${p.id}`)} accessibilityLabel={p.title}>
            <Text variant="heading" numberOfLines={2}>{p.title}</Text>
            <Text variant="small" numberOfLines={2} color="muted">{p.content}</Text>
            <Row style={{ flexWrap: "wrap" }} gap={6}>
              {p.solved ? <Chip label={t("Solved")} tone="good" icon="checkmark-circle-outline" />
                : <Chip label={tn("answers", p.answer_count)} tone={p.answer_count ? "teal" : "muted"} />}
              <Text variant="small">{p.author_name} · {timeAgo(p.created_at, t)}</Text>
            </Row>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
