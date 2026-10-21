import React, { useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/options";
import { radius, space, useColors } from "@/lib/theme";
import type { ChatPost } from "@/lib/types";
import { Button, Card, Chip, ChipRow, Empty, ErrorBox, Loading, Row, Text } from "@/components/ui";

// "all" = questions for every student in Korea; "campus" = questions only my
// university can see (the server already hides other campuses' posts).
export type Audience = "all" | "campus";

export default function ChatTab() {
  const c = useColors();
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

  const segment = (value: Audience, label: string, icon: React.ComponentProps<typeof Ionicons>["name"]) => {
    const on = audience === value;
    return (
      <Pressable onPress={() => setAudience(value)} accessibilityRole="tab" accessibilityState={{ selected: on }}
        style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10,
          borderRadius: radius.input - 2, backgroundColor: on ? c.accent : "transparent" }}>
        <Ionicons name={icon} size={16} color={on ? c.onAccent : c.muted} />
        <Text variant="small" style={{ fontWeight: "700", color: on ? c.onAccent : c.muted }} numberOfLines={1}>{label}</Text>
      </Pressable>
    );
  };

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
              <View style={{ flexDirection: "row", padding: 3, borderRadius: radius.input, borderWidth: 1, borderColor: c.rule, backgroundColor: c.card }}>
                {segment("all", "All students", "earth-outline")}
                {segment("campus", `${uni} only`, "school-outline")}
              </View>
            ) : null}
            <Button title={audience === "campus" ? `Ask ${uni} students` : "Ask all students"} icon="add-circle-outline"
              onPress={() => router.push(`/chat/new?to=${audience}`)} />
            <ChipRow>
              <Chip label="All questions" selected={!unanswered} onPress={() => setUnanswered(false)} />
              <Chip label="Unanswered" selected={unanswered} onPress={() => setUnanswered(true)} />
            </ChipRow>
            {error ? <ErrorBox message={error} onRetry={reload} /> : null}
          </View>
        }
        ListEmptyComponent={loading ? <Loading /> : (
          <Empty icon="chatbox-ellipses-outline" title="No questions yet"
            body={audience === "campus" ? `Ask the first one. Only ${uni} students will see it.` : "Ask the first one. Students across Korea answer."} />
        )}
        renderItem={({ item: p }) => (
          <Card onPress={() => router.push(`/chat/${p.id}`)} accessibilityLabel={p.title}>
            <Text variant="heading" numberOfLines={2}>{p.title}</Text>
            <Text variant="small" numberOfLines={2} color="muted">{p.content}</Text>
            <Row style={{ flexWrap: "wrap" }} gap={6}>
              {p.solved ? <Chip label="Solved" tone="good" icon="checkmark-circle-outline" />
                : <Chip label={`${p.answer_count} answer${p.answer_count === 1 ? "" : "s"}`} tone={p.answer_count ? "teal" : "muted"} />}
              <Text variant="small">{p.author_name} · {timeAgo(p.created_at)}</Text>
            </Row>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
