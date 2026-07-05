import React, { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import type { SearchResult } from "@/lib/types";
import { Badge, Card, EmptyState } from "@/components/ui";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search-as-you-type against GET /search (clubs + jobs).
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      return;
    }
    timer.current = setTimeout(async () => {
      setBusy(true);
      const { data } = await api.get<{ results: SearchResult[] }>(
        `/search?q=${encodeURIComponent(q)}&limit=15`
      );
      setBusy(false);
      setResults(data?.results ?? []);
    }, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  const open = (r: SearchResult) => {
    if (r.type === "job") router.push(`/internships/${r.id}`);
    else router.push(`/community/${r.id}`);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-3">
        <View className="flex-row items-center bg-card border border-border rounded-xl px-3">
          <Ionicons name="search" size={18} color="#8b8ba3" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search internships, clubs, communities…"
            placeholderTextColor="#5c5c73"
            autoFocus
            className="flex-1 px-2 py-3 text-white"
          />
          {busy && <Text className="text-muted text-xs">…</Text>}
        </View>
      </View>

      <FlatList
        data={results ?? []}
        keyExtractor={(r) => `${r.type}-${r.id}`}
        contentContainerClassName="p-4 pb-10"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          results === null ? (
            <Text className="text-muted text-center mt-10">
              Type at least 2 characters to search everything on ICOM.
            </Text>
          ) : busy ? null : (
            <EmptyState title="No results" subtitle="Try a different keyword." />
          )
        }
        renderItem={({ item: r }) => (
          <Pressable onPress={() => open(r)}>
            <Card className="mb-2.5 active:border-icon-500">
              <View className="flex-row items-center">
                <View className="bg-icon-500/15 rounded-xl w-10 h-10 items-center justify-center">
                  <Ionicons
                    name={r.type === "job" ? "briefcase" : "people"}
                    size={18}
                    color="#7c7cff"
                  />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-white font-medium" numberOfLines={1}>
                    {r.label}
                  </Text>
                  <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>
                    {r.sub}
                  </Text>
                </View>
                <Badge
                  label={r.type === "job" ? "Internship" : r.type === "community" ? "Community" : "Club"}
                  tone={r.type === "job" ? "amber" : "indigo"}
                />
              </View>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}
