import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { radius, space, useColors } from "@/lib/theme";
import type { ChatPost } from "@/lib/types";
import { Button, Input, Screen, Text } from "@/components/ui";
import { useT } from "@/i18n";

export default function AskQuestion() {
  const { user } = useAuth();
  const c = useColors();
  const { t } = useT();
  const { to } = useLocalSearchParams<{ to?: string }>();
  const uni = (user?.university || "").toUpperCase();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [picked, setCampus] = useState<boolean | null>(null);   // null = follow the tab I came from
  const campus = (picked ?? to === "campus") && !!uni;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true); setError("");
    const { data, error: e } = await api.post<{ post: ChatPost }>("/chat/posts", {
      title, content, scope: campus ? "university" : "",   // the server fills in my university
    });
    setBusy(false);
    if (data) router.replace(`/chat/${data.post.id}`); else setError(e || t("Couldn't post your question."));
  };

  const option = (on: boolean, onPress: () => void, icon: React.ComponentProps<typeof Ionicons>["name"], label: string, hint: string) => (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: on }}
      style={{ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderRadius: radius.card,
        borderWidth: on ? 2 : 1, borderColor: on ? c.accent : c.rule, backgroundColor: on ? c.accentSoft : c.card }}>
      <Ionicons name={icon} size={22} color={on ? c.accent : c.muted} />
      <View style={{ flex: 1 }}>
        <Text variant="heading">{label}</Text>
        <Text variant="small">{hint}</Text>
      </View>
      <Ionicons name={on ? "radio-button-on" : "radio-button-off"} size={20} color={on ? c.accent : c.muted} />
    </Pressable>
  );

  return (
    <Screen>
      <Text variant="small" style={{ fontWeight: "600", color: c.ink }}>{t("Who do you want to ask?")}</Text>
      {option(!campus, () => setCampus(false), "earth-outline", t("All students"), t("Every international student in Korea can see and answer."))}
      {uni ? option(campus, () => setCampus(true), "school-outline", t("{uni} students only", { uni }), t("Only students at {uni} can see and answer.", { uni })) : null}
      <Input label={t("Question")} value={title} onChangeText={setTitle} placeholder={t("e.g. Where can I get ARC photos near campus?")} maxLength={200} />
      <Input label={t("Details")} value={content} onChangeText={setContent} placeholder={t("Add what you've tried or where you are")} multiline
        style={{ minHeight: 120, textAlignVertical: "top", paddingTop: 12 }} maxLength={3000} />
      {error ? <Text color="coral" variant="small">{error}</Text> : null}
      <Button title={campus ? t("Ask {uni} students", { uni }) : t("Ask all students")} onPress={submit} loading={busy} disabled={!title.trim() || !content.trim()} />
      <Text variant="small">{t("Be kind. Posts that break the community rules are blocked automatically, and you can report anything that slips through.")}</Text>
    </Screen>
  );
}
