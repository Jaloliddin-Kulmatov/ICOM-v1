import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import type { NewsPost, PostComment } from "@/lib/types";
import { Avatar, EmptyState, ErrorBanner, LoadingScreen } from "@/components/ui";

// The posts list endpoint has no single-post GET, so we find the post in the
// feed and load its comments separately (same approach as the web News tab).
export default function NewsPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<NewsPost | null>(null);
  const [comments, setComments] = useState<PostComment[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const loadComments = useCallback(async () => {
    const { data, error: err } = await api.get<{ comments: PostComment[] }>(
      `/posts/${id}/comments`
    );
    if (data) setComments(data.comments);
    else setError(err);
  }, [id]);

  useEffect(() => {
    (async () => {
      const { data, error: err } = await api.get<{ posts: NewsPost[] }>("/posts");
      const found = data?.posts.find((p) => p.id === Number(id));
      if (found) setPost(found);
      else setLoadError(err || "Post not found (it may have been deleted).");
      await loadComments();
    })();
  }, [id, loadComments]);

  const submit = async () => {
    const content = input.trim();
    if (!content || busy) return;
    setBusy(true);
    setError(null);
    const { error: err } = await api.post(`/posts/${id}/comments`, { content });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setInput("");
    await loadComments();
  };

  if (loadError) return <EmptyState title="Couldn't load post" subtitle={loadError} />;
  if (!post) return <LoadingScreen />;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView className="flex-1" contentContainerClassName="p-4 pb-6">
        <View className="flex-row items-center">
          <Avatar name={post.posted_as_label || post.author_name} size={36} />
          <View className="ml-2.5 flex-1">
            <Text className="text-white font-medium">
              {post.posted_as_label || post.author_name}
            </Text>
            <Text className="text-muted text-xs capitalize">
              {post.posted_as_type} · {timeAgo(post.created_at)}
            </Text>
          </View>
        </View>

        <Text className="text-[#e2e2f0] leading-6 mt-3">{post.content}</Text>

        <Text className="text-white text-lg font-bold mt-8 mb-2">
          {comments?.length ?? post.comment_count}{" "}
          {(comments?.length ?? post.comment_count) === 1 ? "Comment" : "Comments"}
        </Text>

        {(comments || []).map((c) => (
          <View
            key={c.id}
            className={`bg-card border border-border rounded-2xl p-3.5 mb-2.5 ${
              c.parent_id ? "ml-8" : ""
            }`}
          >
            <View className="flex-row items-center">
              <Avatar name={c.author_name} size={24} />
              <Text className="text-white text-sm font-medium ml-2 flex-1">
                {c.author_name}
              </Text>
              <Text className="text-muted text-xs">{timeAgo(c.created_at)}</Text>
            </View>
            <Text className="text-[#c9c9dc] mt-2">{c.content}</Text>
          </View>
        ))}

        {comments !== null && comments.length === 0 && (
          <Text className="text-muted text-sm">No comments yet — be the first.</Text>
        )}

        <ErrorBanner message={error} />
      </ScrollView>

      <View className="flex-row items-end border-t border-border bg-surface px-3 py-2.5">
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Write a comment…"
          placeholderTextColor="#5c5c73"
          multiline
          maxLength={500}
          className="flex-1 bg-card border border-border rounded-2xl px-4 py-3 text-white max-h-32"
        />
        <Pressable
          onPress={submit}
          disabled={busy || !input.trim()}
          className={`ml-2 rounded-full w-11 h-11 items-center justify-center ${
            busy || !input.trim() ? "bg-icon-500/40" : "bg-icon-500 active:bg-icon-600"
          }`}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
