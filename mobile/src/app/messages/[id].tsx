import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { radius, space, useColors } from "@/lib/theme";
import type { Person } from "@/lib/types";
import { Text } from "@/components/ui";
import { useT } from "@/i18n";

type Msg = { id: number; sender_id: number; content: string; created_at: string };
type Thread = { id: number; other: Person | null; blocked: boolean; blocked_by_me: boolean; other_read_up_to: number };

const POLL_MS = 4000;   // until push delivers new messages instantly

export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const c = useColors();
  const { t } = useT();
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const lastId = useRef(0);
  const list = useRef<FlatList<Msg>>(null);

  const load = useCallback(async (incremental: boolean) => {
    const { data, error: e } = await api.get<{ conversation: Thread; messages: Msg[] }>(
      `/messages/conversations/${id}?after=${incremental ? lastId.current : 0}`);
    if (!data) { if (!incremental) setError(e || t("Couldn't load this chat.")); return; }
    setThread(data.conversation);
    if (data.messages.length) {
      lastId.current = Math.max(lastId.current, data.messages[data.messages.length - 1].id);
      // A poll and a send can fetch the same new message at once; add each id only once.
      setMessages((m) => {
        if (!incremental) return data.messages;
        const seen = new Set(m.map((x) => x.id));
        const fresh = data.messages.filter((x) => !seen.has(x.id));
        return fresh.length ? [...m, ...fresh] : m;
      });
    }
  }, [id, t]);

  useEffect(() => {
    load(false);
    const t = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText(""); setError("");
    const { error: e } = await api.post(`/messages/conversations/${id}`, { content: body });
    if (e) { setError(e); setText(body); } else load(true);
  };

  const menu = () => {
    if (!thread?.other) return;
    const other = thread.other;
    Alert.alert(other.name, undefined, [
      { text: thread.blocked_by_me ? t("Unblock") : t("Block"), style: "destructive", onPress: async () => {
        await (thread.blocked_by_me ? api.delete(`/users/${other.id}/block`) : api.post(`/users/${other.id}/block`));
        load(false);
      } },
      { text: t("Report"), onPress: async () => {
        await api.post("/users/reports", { target_type: "user", target_id: other.id, reason: "Reported from the app" });
        Alert.alert(t("Thanks"), t("An admin will review this report."));
      } },
      { text: t("Cancel"), style: "cancel" },
    ]);
  };

  const lastMine = [...messages].reverse().find((m) => m.sender_id === user?.id);

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen options={{
        title: thread?.other?.name || "",
        headerRight: () => (
          <Pressable onPress={menu} accessibilityLabel={t("Block or report")} hitSlop={10}>
            <Ionicons name="ellipsis-horizontal" size={22} color={c.ink} />
          </Pressable>
        ),
      }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: space.lg, gap: space.sm }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
          renderItem={({ item: m }) => {
            const mine = m.sender_id === user?.id;
            return (
              <View style={{ alignItems: mine ? "flex-end" : "flex-start" }}>
                <View style={{ maxWidth: "80%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18,
                  backgroundColor: mine ? c.accent : c.card, borderWidth: mine ? 0 : 1, borderColor: c.rule }}>
                  <Text style={{ color: mine ? c.onAccent : c.ink }}>{m.content}</Text>
                </View>
                {mine && lastMine?.id === m.id && (
                  <Text variant="small" style={{ marginTop: 2 }}>{(thread?.other_read_up_to || 0) >= m.id ? t("Seen") : t("Sent")}</Text>
                )}
              </View>
            );
          }}
        />
        {error ? <Text color="coral" variant="small" style={{ paddingHorizontal: space.lg }}>{error}</Text> : null}
        {thread?.blocked ? (
          <Text variant="small" style={{ padding: space.lg, textAlign: "center" }}>
            {thread.blocked_by_me ? t("You blocked this person. Unblock them from the ⋯ menu to message again.") : t("You can't message this person.")}
          </Text>
        ) : (
          <View style={{ flexDirection: "row", gap: space.sm, padding: space.md, borderTopWidth: 1, borderTopColor: c.rule, backgroundColor: c.card }}>
            <TextInput value={text} onChangeText={setText} placeholder={t("Message {name}", { name: thread?.other?.name.split(" ")[0] || "" })}
              placeholderTextColor={c.muted} multiline maxLength={2000} accessibilityLabel={t("Message")}
              style={{ flex: 1, minHeight: 44, maxHeight: 120, borderWidth: 1, borderColor: c.rule, borderRadius: radius.input,
                paddingHorizontal: 14, paddingVertical: 10, color: c.ink, backgroundColor: c.inputBg, fontSize: 16 }} />
            <Pressable onPress={send} disabled={!text.trim()} accessibilityRole="button" accessibilityLabel={t("Send")}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: text.trim() ? c.accent : c.rule, alignItems: "center", justifyContent: "center", alignSelf: "flex-end" }}>
              <Ionicons name="send" size={18} color={c.onAccent} />
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
