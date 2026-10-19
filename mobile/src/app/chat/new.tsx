import React, { useState } from "react";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { ChatPost } from "@/lib/types";
import { Button, Chip, ChipRow, Input, Screen, Text } from "@/components/ui";

export default function AskQuestion() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [campus, setCampus] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true); setError("");
    const { data, error: e } = await api.post<{ post: ChatPost }>("/chat/posts", {
      title, content, scope: campus ? "university" : "",   // the server fills in my university
    });
    setBusy(false);
    if (data) router.replace(`/chat/${data.post.id}`); else setError(e || "Couldn't post your question.");
  };

  return (
    <Screen>
      <Input label="Question" value={title} onChangeText={setTitle} placeholder="e.g. Where can I get ARC photos near campus?" maxLength={200} />
      <Input label="Details" value={content} onChangeText={setContent} placeholder="Add what you've tried or where you are" multiline
        style={{ minHeight: 120, textAlignVertical: "top", paddingTop: 12 }} maxLength={3000} />
      <Text variant="small" style={{ fontWeight: "600" }}>Who can see it</Text>
      <ChipRow>
        <Chip label="All of Korea" selected={!campus} onPress={() => setCampus(false)} />
        {user?.university ? <Chip label={`Only ${user.university.toUpperCase()}`} selected={campus} onPress={() => setCampus(true)} /> : null}
      </ChipRow>
      {error ? <Text color="coral" variant="small">{error}</Text> : null}
      <Button title="Post question" onPress={submit} loading={busy} disabled={!title.trim() || !content.trim()} />
      <Text variant="small">Be kind. Posts that break the community rules are blocked automatically, and you can report anything that slips through.</Text>
    </Screen>
  );
}
