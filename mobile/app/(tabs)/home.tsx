import React, { useCallback, useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { TopCompany } from "@/lib/types";
import { Card } from "@/components/ui";

interface Notice {
  id: number;
  category: string;
  title: string;
  url: string;
  posted_date: string;
}

const QUICK_LINKS: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  href: string;
}[] = [
  {
    icon: "briefcase",
    label: "Internships",
    sub: "English-friendly listings",
    href: "/(tabs)/internships",
  },
  { icon: "people", label: "Community", sub: "Clubs & communities", href: "/(tabs)/community" },
  { icon: "chatbubbles", label: "Q&A Chat", sub: "Ask other students", href: "/(tabs)/chat" },
  { icon: "sparkles", label: "AI Assistant", sub: "Visa, housing, banking", href: "/ai" },
  { icon: "book", label: "Support Guides", sub: "Visa to banking, step by step", href: "/support" },
  { icon: "restaurant", label: "Daily Life", sub: "Food & transport tips", href: "/daily-life" },
  { icon: "school", label: "Universities", sub: "Directory & ambassadors", href: "/universities" },
  { icon: "bookmark", label: "Saved", sub: "Your bookmarked internships", href: "/bookmarks" },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<TopCompany[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [members, setMembers] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [companiesRes, newsRes, statsRes] = await Promise.all([
      api.get<{ companies: TopCompany[] }>("/admin/jobs/top-companies?limit=5"),
      api.get<{ notices: Notice[] }>("/news"),
      api.get<{ total_members: number }>("/track/stats"),
    ]);
    if (companiesRes.data) setCompanies(companiesRes.data.companies);
    if (newsRes.data) setNotices(newsRes.data.notices.slice(0, 5));
    if (statsRes.data) setMembers(statsRes.data.total_members);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const firstName = (user?.name || "").split(/\s+/)[0] || "there";

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-4 pb-10"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
      }
    >
      <Text className="text-white text-2xl font-bold">Hi {firstName} 👋</Text>
      <Text className="text-muted mt-1">
        {members !== null
          ? `You're one of ${members} international students on ICOM.`
          : "Your community in Korea, all in one place."}
      </Text>

      <View className="flex-row flex-wrap -mx-1.5 mt-5">
        {QUICK_LINKS.map((q) => (
          <Pressable
            key={q.label}
            onPress={() => router.push(q.href as never)}
            className="w-1/2 px-1.5 mb-3"
          >
            <Card className="active:border-icon-500">
              <Ionicons name={q.icon} size={22} color="#7c7cff" />
              <Text className="text-white font-semibold mt-2">{q.label}</Text>
              <Text className="text-muted text-xs mt-0.5">{q.sub}</Text>
            </Card>
          </Pressable>
        ))}
      </View>

      {companies.length > 0 && (
        <>
          <Text className="text-white text-lg font-bold mt-4 mb-3">Top hiring companies</Text>
          <Card>
            {companies.map((c, i) => (
              <View
                key={c.name}
                className={`flex-row items-center justify-between py-2.5 ${
                  i > 0 ? "border-t border-border" : ""
                }`}
              >
                <Text className="text-white font-medium flex-1" numberOfLines={1}>
                  {c.name}
                </Text>
                <Text className="text-icon-300 text-sm">
                  {c.jobs} {c.jobs === 1 ? "opening" : "openings"}
                </Text>
              </View>
            ))}
          </Card>
        </>
      )}

      {notices.length > 0 && (
        <>
          <Text className="text-white text-lg font-bold mt-6 mb-3">University news</Text>
          {notices.map((n) => (
            <Pressable key={n.id} onPress={() => n.url && Linking.openURL(n.url)}>
              <Card className="mb-3 active:border-icon-500">
                <Text className="text-icon-300 text-xs uppercase mb-1">{n.category}</Text>
                <Text className="text-white font-medium" numberOfLines={2}>
                  {n.title}
                </Text>
                <Text className="text-muted text-xs mt-1.5">{n.posted_date}</Text>
              </Card>
            </Pressable>
          ))}
        </>
      )}
    </ScrollView>
  );
}
