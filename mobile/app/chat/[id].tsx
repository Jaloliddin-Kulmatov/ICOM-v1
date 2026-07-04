import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import type { ChatPost } from "@/lib/types";
import { Avatar, EmptyState, ErrorBanner, LoadingScreen } from "@/components/ui";

export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<ChatPost | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error: err } = await api.get<{ post: ChatPost }>(`/chat/posts/${id}`);
    if (data?.post) setPost(data.post);
    else setLoadError(err || "Post not found.");
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const submitAnswer = async () => {
    const content = answer.trim();
    if (!content) return;
    setBusy(true);
    setError(null);
    const { error: err } = await api.post(`/chat/posts/${id}/answers`, { content });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setAnswer("");
    await load();
  };

  const confirmDelete = (kind: "post" | "answer", targetId: number) => {
    Alert.alert(
      kind === "post" ? "Delete question?" : "Delete answer?",
      "This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const path = kind === "post" ? `/chat/posts/${targetId}` : `/chat/answers/${targetId}`;
            const { error: err } = await api.delete(path);
            if (err) {
              setError(err);
              return;
            }
            if (kind === "post") router.back();
            else await load();
          },
        },
      ]
    );
  };

  if (loadError) return <EmptyState title="Couldn't load question" subtitle={loadError} />;
  if (!post) return <LoadingScreen />;

  const canDelete = (authorId: number) => user && (user.id === authorId || user.role === "admin");

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView className="flex-1" contentContainerClassName="p-4 pb-6">
        <View className="flex-row items-center">
          <Avatar name={post.author_name} size={36} />
          <View className="ml-2.5 flex-1">
            <Text className="text-white font-medium">{post.author_name}</Text>
            <Text className="text-muted text-xs">
              {[post.author_university, post.author_country].filter(Boolean).join(" · ")}
              {post.scope ? " · university only" : " · All Korea"}
            </Text>
          </View>
          <Text className="text-muted text-xs">{timeAgo(post.created_at)}</Text>
          {canDelete(post.user_id) && (
            <Pressable onPress={() => confirmDelete("post", post.id)} className="ml-3 p-1">
              <Ionicons name="trash-outline" size={18} color="#f87171" />
            </Pressable>
          )}
        </View>

        <Text className="text-white text-xl font-bold mt-4">{post.title}</Text>
        <Text className="text-[#c9c9dc] leading-6 mt-2">{post.content}</Text>

        {post.image_url ? (
          <Image
            source={{ uri: post.image_url }}
            className="w-full rounded-2xl mt-4"
            style={{ height: 220 }}
            resizeMode="cover"
          />
        ) : null}

        <Text className="text-white text-lg font-bold mt-8 mb-2">
          {post.answers?.length || 0} {(post.answers?.length || 0) === 1 ? "Answer" : "Answers"}
        </Text>

        {(post.answers || []).map((a) => (
          <View key={a.id} className="bg-card border border-border rounded-2xl p-4 mb-3">
            <View className="flex-row items-center">
              <Avatar name={a.author_name} size={28} />
              <View className="ml-2 flex-1">
                <Text className="text-white text-sm font-medium">{a.author_name}</Text>
                <Text className="text-muted text-xs">
                  {[a.author_university, a.author_country].filter(Boolean).join(" · ")}
                </Text>
              </View>
              <Text className="text-muted text-xs">{timeAgo(a.created_at)}</Text>
              {canDelete(a.user_id) && (
                <Pressable onPress={() => confirmDelete("answer", a.id)} className="ml-3 p-1">
                  <Ionicons name="trash-outline" size={16} color="#f87171" />
                </Pressable>
              )}
            </View>
            <Text className="text-[#c9c9dc] leading-6 mt-2.5">{a.content}</Text>
          </View>
        ))}

        {(post.answers?.length || 0) === 0 && (
          <Text className="text-muted text-sm">No answers yet — share what you know!</Text>
        )}

        <ErrorBanner message={error} />
      </ScrollView>

      <View className="flex-row items-end border-t border-border bg-surface px-3 py-2.5">
        <TextInput
          value={answer}
          onChangeText={setAnswer}
          placeholder="Write an answer…"
          placeholderTextColor="#5c5c73"
          multiline
          maxLength={3000}
          className="flex-1 bg-card border border-border rounded-2xl px-4 py-3 text-white max-h-32"
        />
        <Pressable
          onPress={submitAnswer}
          disabled={busy || !answer.trim()}
          className={`ml-2 rounded-full w-11 h-11 items-center justify-center ${
            busy || !answer.trim() ? "bg-icon-500/40" : "bg-icon-500 active:bg-icon-600"
          }`}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
