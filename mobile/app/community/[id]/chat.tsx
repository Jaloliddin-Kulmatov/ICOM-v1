import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import type { ClubMessage } from "@/lib/types";
import { EmptyState, ErrorBanner, LoadingScreen } from "@/components/ui";

const POLL_MS = 5000;

export default function ClubChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ClubMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<ClubMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList<ClubMessage>>(null);
  const lastIdRef = useRef(0);

  const fetchNew = useCallback(async () => {
    const { data, error: err } = await api.get<{ messages: ClubMessage[] }>(
      `/clubs/${id}/chat?after=${lastIdRef.current}`
    );
    if (err) {
      // Members-only 403 etc. — show once, stop spamming.
      setError((prev) => prev ?? err);
      setMessages((prev) => prev ?? []);
      return;
    }
    if (data && data.messages.length > 0) {
      lastIdRef.current = data.messages[data.messages.length - 1]!.id;
      setMessages((prev) => [...(prev ?? []), ...data.messages]);
    } else {
      setMessages((prev) => prev ?? []);
    }
  }, [id]);

  // Initial load + light polling while the screen is mounted (the backend has
  // no websockets; the web app polls the same endpoint).
  useEffect(() => {
    fetchNew();
    const timer = setInterval(fetchNew, POLL_MS);
    return () => clearInterval(timer);
  }, [fetchNew]);

  const send = async () => {
    const content = input.trim();
    if (!content || busy) return;
    setBusy(true);
    const body: Record<string, unknown> = { content };
    if (replyTo) body.reply_to_id = replyTo.id;
    const { error: err } = await api.post(`/clubs/${id}/chat`, body);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setInput("");
    setReplyTo(null);
    await fetchNew();
    listRef.current?.scrollToEnd({ animated: true });
  };

  if (messages === null) return <LoadingScreen message="Loading chat…" />;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {error ? (
        <View className="p-4">
          <ErrorBanner message={error} />
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => String(m.id)}
        contentContainerClassName="p-4 pb-4"
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          !error ? (
            <EmptyState title="No messages yet" subtitle="Say hi to your club!" />
          ) : null
        }
        renderItem={({ item: m }) => {
          const mine = m.user_id === user?.id;
          return (
            <Pressable
              onLongPress={() => setReplyTo(m)}
              className={`mb-2.5 max-w-[85%] ${mine ? "self-end" : "self-start"}`}
            >
              {!mine && (
                <Text className="text-muted text-xs mb-0.5 ml-1">{m.author_name}</Text>
              )}
              <View
                className={`rounded-2xl px-3.5 py-2.5 ${
                  mine ? "bg-icon-500" : "bg-card border border-border"
                }`}
              >
                {m.reply_to_id ? (
                  <View
                    className={`border-l-2 pl-2 mb-1.5 ${
                      mine ? "border-white/40" : "border-icon-500"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${mine ? "text-white/80" : "text-icon-300"}`}
                    >
                      {m.reply_to_name}
                    </Text>
                    <Text
                      className={`text-xs ${mine ? "text-white/60" : "text-muted"}`}
                      numberOfLines={1}
                    >
                      {m.reply_to_content}
                    </Text>
                  </View>
                ) : null}
                <Text className={mine ? "text-white" : "text-[#e2e2f0]"}>{m.content}</Text>
              </View>
              <Text className={`text-muted text-[10px] mt-0.5 ${mine ? "text-right mr-1" : "ml-1"}`}>
                {timeAgo(m.created_at)}
              </Text>
            </Pressable>
          );
        }}
      />

      {replyTo && (
        <View className="flex-row items-center bg-surface border-t border-border px-4 py-2">
          <View className="flex-1 border-l-2 border-icon-500 pl-2">
            <Text className="text-icon-300 text-xs font-medium">
              Replying to {replyTo.author_name}
            </Text>
            <Text className="text-muted text-xs" numberOfLines={1}>
              {replyTo.content}
            </Text>
          </View>
          <Pressable onPress={() => setReplyTo(null)} className="p-1.5">
            <Ionicons name="close" size={18} color="#8b8ba3" />
          </Pressable>
        </View>
      )}

      <View className="flex-row items-end border-t border-border bg-surface px-3 py-2.5">
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Message… (long-press a message to reply)"
          placeholderTextColor="#5c5c73"
          multiline
          maxLength={1000}
          className="flex-1 bg-card border border-border rounded-2xl px-4 py-3 text-white max-h-32"
        />
        <Pressable
          onPress={send}
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
