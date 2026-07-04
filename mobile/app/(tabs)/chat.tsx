import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import type { ChatPost } from "@/lib/types";
import { Avatar, EmptyState, LoadingScreen } from "@/components/ui";

type Scope = "all" | "university";

export default function ChatScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ChatPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data, error: err } = await api.get<{ posts: ChatPost[] }>("/chat/posts");
    if (data) {
      setPosts(data.posts);
      setError(null);
    } else {
      setError(err);
      setPosts((prev) => prev ?? []);
    }
  }, []);

  // Refetch whenever the tab regains focus so a question posted from the
  // modal shows up immediately.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const visible = useMemo(() => {
    if (!posts) return [];
    // Server already filters other universities' posts out; here we just
    // split "All Korea" (empty scope) from "my university" (non-empty).
    return posts.filter((p) => (scope === "all" ? !p.scope : !!p.scope));
  }, [posts, scope]);

  const uniLabel = user?.university?.trim() ? `${user.university} Chat` : "My University";

  if (posts === null) return <LoadingScreen message="Loading questions…" />;

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row px-4 pt-3 pb-1">
        {(
          [
            ["all", "All Korea"],
            ["university", uniLabel],
          ] as [Scope, string][]
        ).map(([key, label]) => {
          const active = scope === key;
          return (
            <Pressable
              key={key}
              onPress={() => setScope(key)}
              className={`rounded-full px-4 py-2 mr-2 border ${
                active ? "bg-icon-500 border-icon-500" : "bg-card border-border"
              }`}
            >
              <Text className={active ? "text-white font-semibold" : "text-muted"}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(p) => String(p.id)}
        contentContainerClassName="p-4 pb-24"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
        ListEmptyComponent={
          <EmptyState
            title={error ? "Couldn't load questions" : "No questions yet"}
            subtitle={error || "Be the first to ask something!"}
          />
        }
        renderItem={({ item: post }) => (
          <Pressable onPress={() => router.push(`/chat/${post.id}`)}>
            <View className="bg-card border border-border rounded-2xl p-4 mb-3 active:border-icon-500">
              <View className="flex-row items-center">
                <Avatar name={post.author_name} size={32} />
                <View className="ml-2.5 flex-1">
                  <Text className="text-white text-sm font-medium">{post.author_name}</Text>
                  <Text className="text-muted text-xs">
                    {[post.author_university, post.author_country].filter(Boolean).join(" · ") ||
                      "International student"}
                  </Text>
                </View>
                <Text className="text-muted text-xs">{timeAgo(post.created_at)}</Text>
              </View>

              <Text className="text-white font-semibold text-base mt-3" numberOfLines={2}>
                {post.title}
              </Text>
              <Text className="text-muted text-sm mt-1" numberOfLines={2}>
                {post.content}
              </Text>

              <View className="flex-row items-center mt-3">
                <Ionicons name="chatbubble-outline" size={14} color="#8b8ba3" />
                <Text className="text-muted text-xs ml-1.5">
                  {post.answer_count} {post.answer_count === 1 ? "answer" : "answers"}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
      />

      <Pressable
        onPress={() => router.push("/chat/new")}
        className="absolute bottom-6 right-5 bg-icon-500 active:bg-icon-600 rounded-full w-14 h-14 items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
    </View>
  );
}
