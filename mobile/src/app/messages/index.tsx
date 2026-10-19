import React, { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { FlatList, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/options";
import { space, useColors } from "@/lib/theme";
import type { Person } from "@/lib/types";
import { Empty, ErrorBox, Input, Loading, Text } from "@/components/ui";

type Msg = { id: number; sender_id: number; content: string; created_at: string };
type Conv = { id: number; other: Person; last_message: Msg | null; unread: number; blocked_by_me: boolean };

function Avatar({ name }: { name: string }) {
  const c = useColors();
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.accentSoft, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontWeight: "800", color: c.accent }}>{initials}</Text>
    </View>
  );
}

export default function Inbox() {
  const c = useColors();
  const { to } = useLocalSearchParams<{ to?: string }>();
  const inbox = useApi<{ conversations: Conv[] }>("/messages/conversations");
  const convs = inbox.data?.conversations || [];
  const loading = inbox.loading;
  const [openError, setOpenError] = useState("");
  const error = openError || inbox.error;
  const load = inbox.reload;
  const [q, setQ] = useState("");
  const [found, setFound] = useState<{ term: string; users: Person[] }>({ term: "", users: [] });
  useFocusEffect(load);

  const open = useCallback(async (userId: number) => {
    const { data, error: e } = await api.post<{ conversation: { id: number } }>("/messages/conversations", { user_id: userId });
    if (data) router.push(`/messages/${data.conversation.id}`); else setOpenError(e || "Couldn't start the chat.");
  }, []);

  // "Message" buttons elsewhere open /messages?to=<userId>.
  useEffect(() => {
    if (!to) return;
    api.post<{ conversation: { id: number } }>("/messages/conversations", { user_id: Number(to) }).then(({ data, error: e }) => {
      if (data) router.push(`/messages/${data.conversation.id}`); else setOpenError(e || "Couldn't start the chat.");
    });
  }, [to]);

  // Search everyone on ICOM by name (2+ letters).
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const t = setTimeout(() => {
      api.get<{ users: Person[] }>(`/users/search?q=${encodeURIComponent(term)}`)
        .then(({ data }) => setFound({ term, users: data?.users || [] }));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);
  const people = q.trim().length >= 2 && found.term === q.trim() ? found.users : [];

  const term = q.trim().toLowerCase();
  const shown = term ? convs.filter((x) => x.other.name.toLowerCase().includes(term)) : convs;
  const inChats = new Set(shown.map((x) => x.other.id));
  const newPeople = people.filter((p) => !inChats.has(p.id));

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        data={shown}
        keyExtractor={(x) => String(x.id)}
        contentContainerStyle={{ padding: space.lg, gap: space.xs, paddingBottom: space.xxl }}
        ListHeaderComponent={
          <View style={{ gap: space.sm, marginBottom: space.sm }}>
            <Input value={q} onChangeText={setQ} placeholder="Search chats or find people" accessibilityLabel="Search people" autoCapitalize="words" />
            {error ? <ErrorBox message={error} onRetry={load} /> : null}
          </View>
        }
        ListEmptyComponent={loading ? <Loading /> : term ? undefined : (
          <Empty icon="chatbubbles-outline" title="No messages yet" body="Search for a student above, or tap Message on someone's answer." />
        )}
        renderItem={({ item: x }) => (
          <Pressable onPress={() => router.push(`/messages/${x.id}`)} accessibilityRole="button" accessibilityLabel={`Chat with ${x.other.name}`}
            style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.sm, opacity: pressed ? 0.7 : 1 })}>
            <Avatar name={x.other.name} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: x.unread ? "800" : "600" }} numberOfLines={1}>{x.other.name}</Text>
              <Text variant="small" numberOfLines={1} color={x.unread ? "ink" : "muted"}>
                {x.blocked_by_me ? "Blocked" : x.last_message ? x.last_message.content : "Say hello"}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              {x.last_message && <Text variant="small">{timeAgo(x.last_message.created_at)}</Text>}
              {x.unread > 0 && (
                <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: c.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 }}>
                  <Text variant="small" color="onAccent" style={{ fontWeight: "800" }}>{x.unread}</Text>
                </View>
              )}
            </View>
          </Pressable>
        )}
        ListFooterComponent={newPeople.length > 0 ? (
          <View style={{ gap: space.xs, marginTop: space.md }}>
            <Text variant="label">People on ICOM</Text>
            {newPeople.map((p) => (
              <Pressable key={p.id} onPress={() => open(p.id)} accessibilityRole="button" accessibilityLabel={`Message ${p.name}`}
                style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.sm, opacity: pressed ? 0.7 : 1 })}>
                <Avatar name={p.name} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600" }}>{p.name}</Text>
                  <Text variant="small">{[p.university?.toUpperCase(), p.country, p.visa_type].filter(Boolean).join(" · ") || "ICOM member"}</Text>
                </View>
                <Text variant="small" color="accent" style={{ fontWeight: "700" }}>Message</Text>
              </Pressable>
            ))}
          </View>
        ) : term.length >= 2 && shown.length === 0 && !loading ? (
          <Empty icon="search-outline" title="No one on ICOM matches that name" body="Check the spelling, or try their first name only." />
        ) : undefined}
      />
    </SafeAreaView>
  );
}
