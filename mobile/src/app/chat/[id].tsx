import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "@/lib/api";
import { confirmReport } from "@/lib/report";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/options";
import { space, useColors } from "@/lib/theme";
import type { ChatPost } from "@/lib/types";
import { Button, Card, Chip, Empty, Input, Loading, Row, Screen, Text } from "@/components/ui";
import { useT } from "@/i18n";

const GUIDE_TOPICS: [RegExp, string, string][] = [
  [/\b(visa|arc|d-?2|d-?4|d-?10|e-?7|immigration|extend|hikorea|work permit|part[- ]?time)\b|비자|출입국/i, "visa", "Visa & Immigration guide"],
  [/\b(bank|account|transfer|remit|atm)\b|은행/i, "banking", "Banking guide"],
  [/\b(insurance|nhis|hospital|clinic|doctor|pharmacy)\b|보험|병원/i, "insurance", "Health insurance guide"],
  [/\b(housing|dorm|rent|deposit|goshiwon|one[- ]room|landlord)\b|기숙사|원룸/i, "housing", "Housing guide"],
  [/\b(bus|subway|metro|train|ktx|t-?money|taxi)\b|버스|지하철/i, "transport", "Transport guide"],
];

export default function QuestionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const c = useColors();
  const { t, tn } = useT();
  const { data, error, reload: load } = useApi<{ post: ChatPost }>(`/chat/posts/${id}`);
  const post = data?.post || null;
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [sendError, setSendError] = useState("");

  if (error && !post) return <Screen><Empty icon="chatbox-ellipses-outline" title={t("Not available")} body={error} /></Screen>;
  if (!post) return <Screen><Loading /></Screen>;

  const guide = GUIDE_TOPICS.find(([re]) => re.test(`${post.title} ${post.content}`));
  const isAsker = user?.id === post.user_id;

  const send = async () => {
    setBusy(true); setSendError("");
    const { error: e } = await api.post(`/chat/posts/${post.id}/answers`, { content: answer.trim() });
    setBusy(false);
    if (e) setSendError(e); else { setAnswer(""); load(); }
  };
  const accept = async (answerId: number) => {
    const { error: e } = await api.post(`/chat/answers/${answerId}/accept`);
    if (!e) load();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
      <Screen>
        <Text variant="title">{post.title}</Text>
        <Text variant="small">{post.author_name}{post.author_university ? ` · ${post.author_university.toUpperCase()}` : ""} · {timeAgo(post.created_at, t)}</Text>
        <Chip label={post.scope ? t("{uni} students only", { uni: post.scope.toUpperCase() }) : t("All students")} icon={post.scope ? "school-outline" : "earth-outline"} />
        <Text>{post.content}</Text>
        {!isAsker && (
          <Pressable onPress={() => confirmReport("chat_post", post.id, t)} hitSlop={8} accessibilityRole="button" style={{ alignSelf: "flex-start" }}>
            <Text variant="small">{t("Report question")}</Text>
          </Pressable>
        )}
        {guide && (
          <Pressable onPress={() => router.push(`/guide/${guide[1]}`)} accessibilityRole="link">
            <Chip label={t("Related: {guide}", { guide: t(guide[2]) })} tone="good" icon="book-outline" />
          </Pressable>
        )}

        <Text variant="label" style={{ marginTop: space.md }}>
          {post.answers?.length ? tn("answers", post.answers.length) : t("No answers yet")}
        </Text>
        {(post.answers || []).map((a) => (
          <Card key={a.id} style={a.is_accepted ? { borderColor: c.accent, borderWidth: 2 } : undefined}>
            {a.is_accepted && <Chip label={t("Accepted answer")} tone="good" icon="checkmark-circle" />}
            <Text>{a.content}</Text>
            <Text variant="small">{a.author_name} · {timeAgo(a.created_at, t)}</Text>
            <Row gap={space.lg}>
              {isAsker && (
                <Pressable onPress={() => accept(a.id)} hitSlop={8} accessibilityRole="button">
                  <Text variant="small" color="accent" style={{ fontWeight: "700" }}>{a.is_accepted ? t("Unaccept") : t("Accept answer")}</Text>
                </Pressable>
              )}
              {a.user_id !== user?.id && (
                <Pressable onPress={() => router.push(`/messages?to=${a.user_id}`)} hitSlop={8} accessibilityRole="button">
                  <Text variant="small" color="accent" style={{ fontWeight: "700" }}>{t("Message")}</Text>
                </Pressable>
              )}
              {a.user_id !== user?.id && (
                <Pressable onPress={() => confirmReport("chat_answer", a.id, t)} hitSlop={8} accessibilityRole="button">
                  <Text variant="small">{t("Report")}</Text>
                </Pressable>
              )}
            </Row>
          </Card>
        ))}

        <View style={{ gap: space.sm, marginTop: space.md }}>
          <Input label={t("Your answer")} value={answer} onChangeText={setAnswer} multiline placeholder={t("Share what worked for you")}
            style={{ minHeight: 90, textAlignVertical: "top", paddingTop: 12 }} maxLength={3000} />
          {sendError ? <Text color="coral" variant="small">{sendError}</Text> : null}
          <Button title={t("Post answer")} onPress={send} loading={busy} disabled={!answer.trim()} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
