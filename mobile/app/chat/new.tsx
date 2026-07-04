import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { ChatPost } from "@/lib/types";
import { Button, ErrorBanner, Input } from "@/components/ui";

export default function NewQuestionScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [scope, setScope] = useState<"all" | "university">("all");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const hasUniversity = !!user?.university?.trim();

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and question are both required.");
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error: err } = await api.post<{ post: ChatPost }>("/chat/posts", {
      title: title.trim(),
      content: content.trim(),
      scope: scope === "university" ? "university" : "all",
    });
    setBusy(false);
    if (err || !data?.post) {
      setError(err || "Could not create the post.");
      return;
    }
    router.replace(`/chat/${data.post.id}`);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerClassName="p-4 pb-10" keyboardShouldPersistTaps="handled">
        <ErrorBanner message={error} />

        <Input
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. How do I extend my D-2 visa?"
          maxLength={200}
        />
        <Input
          label="Your question"
          value={content}
          onChangeText={setContent}
          placeholder="Add details so others can help you better…"
          multiline
          numberOfLines={6}
          maxLength={5000}
          textAlignVertical="top"
          style={{ minHeight: 140 }}
        />

        <Text className="text-muted text-sm mb-2 font-medium">Who can see this?</Text>
        <View className="flex-row mb-6">
          {(
            [
              ["all", "🌏 All Korea"],
              ["university", hasUniversity ? `🏫 ${user!.university} only` : "🏫 My university"],
            ] as ["all" | "university", string][]
          ).map(([key, label]) => {
            const active = scope === key;
            const disabled = key === "university" && !hasUniversity;
            return (
              <Pressable
                key={key}
                disabled={disabled}
                onPress={() => setScope(key)}
                className={`rounded-full px-4 py-2 mr-2 border ${
                  active ? "bg-icon-500 border-icon-500" : "bg-card border-border"
                } ${disabled ? "opacity-40" : ""}`}
              >
                <Text className={active ? "text-white font-semibold" : "text-muted"}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        {!hasUniversity && (
          <Text className="text-muted text-xs -mt-4 mb-4">
            Set your university in Profile to post to a university-only chat.
          </Text>
        )}

        <Button title="Post Question" onPress={submit} loading={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
