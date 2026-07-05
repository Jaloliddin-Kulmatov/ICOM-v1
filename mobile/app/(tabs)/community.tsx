import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import type { Club, NewsPost, Notice } from "@/lib/types";
import { Avatar, Badge, Card, EmptyState, LoadingScreen } from "@/components/ui";

type Tab = "clubs" | "communities" | "news";

export default function CommunityScreen() {
  const [tab, setTab] = useState<Tab>("communities");
  const [clubs, setClubs] = useState<Club[] | null>(null);
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [clubsRes, postsRes, newsRes] = await Promise.all([
      api.get<{ clubs: Club[] }>("/clubs"),
      api.get<{ posts: NewsPost[] }>("/posts"),
      api.get<{ notices: Notice[] }>("/news"),
    ]);
    if (clubsRes.data) {
      setClubs(clubsRes.data.clubs);
      setError(null);
    } else {
      setError(clubsRes.error);
      setClubs((prev) => prev ?? []);
    }
    if (postsRes.data) setPosts(postsRes.data.posts);
    if (newsRes.data) setNotices(newsRes.data.notices.slice(0, 20));
  }, []);

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

  const visibleClubs = useMemo(() => {
    if (!clubs) return [];
    if (tab === "communities") return clubs.filter((c) => c.club_type === "community");
    if (tab === "clubs") return clubs.filter((c) => c.club_type !== "community");
    return [];
  }, [clubs, tab]);

  if (clubs === null) return <LoadingScreen message="Loading community…" />;

  const renderClub = ({ item: c }: { item: Club }) => (
    <Pressable onPress={() => router.push(`/community/${c.id}`)}>
      <Card className="mb-3 active:border-icon-500">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-white font-semibold text-base" numberOfLines={1}>
              {c.name}
            </Text>
            <Text className="text-muted text-xs mt-0.5">
              {[c.club_type === "community" ? c.country : c.university, c.category]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>
          {c.my_status === "approved" || c.is_creator ? (
            <Badge label="Member" tone="green" />
          ) : null}
        </View>
        {c.description ? (
          <Text className="text-muted text-sm mt-2" numberOfLines={2}>
            {c.description}
          </Text>
        ) : null}
        <View className="flex-row items-center mt-3">
          <Ionicons name="people-outline" size={14} color="#8b8ba3" />
          <Text className="text-muted text-xs ml-1.5">
            {c.member_count} {c.member_count === 1 ? "member" : "members"}
          </Text>
        </View>
      </Card>
    </Pressable>
  );

  // The News tab mixes official JBNU notices with posts from ambassadors and
  // club owners — same split the web app shows.
  const newsData: ({ kind: "post"; post: NewsPost } | { kind: "notice"; notice: Notice })[] = [
    ...posts.map((post) => ({ kind: "post" as const, post })),
    ...notices.map((notice) => ({ kind: "notice" as const, notice })),
  ];

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row px-4 pt-3 pb-1">
        {(
          [
            ["communities", "Communities"],
            ["clubs", "Clubs"],
            ["news", "News"],
          ] as [Tab, string][]
        ).map(([key, label]) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              className={`rounded-full px-4 py-2 mr-2 border ${
                active ? "bg-icon-500 border-icon-500" : "bg-card border-border"
              }`}
            >
              <Text className={active ? "text-white font-semibold" : "text-muted"}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {tab !== "news" ? (
        <FlatList
          data={visibleClubs}
          keyExtractor={(c) => String(c.id)}
          contentContainerClassName="p-4 pb-24"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
          }
          ListEmptyComponent={
            <EmptyState
              title={error ? "Couldn't load" : `No ${tab} yet`}
              subtitle={
                error ||
                (tab === "clubs"
                  ? "Clubs are university-specific — set your university in Profile to see yours."
                  : "Create the first one!")
              }
            />
          }
          renderItem={renderClub}
        />
      ) : (
        <FlatList
          data={newsData}
          keyExtractor={(item) =>
            item.kind === "post" ? `p${item.post.id}` : `n${item.notice.id}`
          }
          contentContainerClassName="p-4 pb-24"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
          }
          ListEmptyComponent={
            <EmptyState
              title="No news yet"
              subtitle="University notices and community updates will appear here."
            />
          }
          renderItem={({ item }) =>
            item.kind === "post" ? (
              <Pressable onPress={() => router.push(`/community/post/${item.post.id}`)}>
                <Card className="mb-3 active:border-icon-500">
                  <View className="flex-row items-center">
                    <Avatar name={item.post.posted_as_label || item.post.author_name} size={30} />
                    <View className="ml-2.5 flex-1">
                      <Text className="text-white text-sm font-medium">
                        {item.post.posted_as_label || item.post.author_name}
                      </Text>
                      <Text className="text-muted text-xs capitalize">
                        {item.post.posted_as_type} · {timeAgo(item.post.created_at)}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-[#c9c9dc] mt-2.5" numberOfLines={4}>
                    {item.post.content}
                  </Text>
                  <View className="flex-row items-center mt-3">
                    <Ionicons name="chatbubble-outline" size={14} color="#8b8ba3" />
                    <Text className="text-muted text-xs ml-1.5">
                      {item.post.comment_count}{" "}
                      {item.post.comment_count === 1 ? "comment" : "comments"}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => item.notice.url && Linking.openURL(item.notice.url)}
              >
                <Card className="mb-3 active:border-icon-500">
                  <Text className="text-icon-300 text-xs uppercase mb-1">
                    JBNU · {item.notice.category}
                  </Text>
                  <Text className="text-white font-medium" numberOfLines={2}>
                    {item.notice.title}
                  </Text>
                  <Text className="text-muted text-xs mt-1.5">{item.notice.posted_date}</Text>
                </Card>
              </Pressable>
            )
          }
        />
      )}

      {tab !== "news" && (
        <Pressable
          onPress={() => router.push("/community/new")}
          className="absolute bottom-6 right-5 bg-icon-500 active:bg-icon-600 rounded-full w-14 h-14 items-center justify-center shadow-lg"
        >
          <Ionicons name="add" size={30} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}
