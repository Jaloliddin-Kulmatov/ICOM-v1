import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import type { AiTurn } from "@/lib/types";

const SUGGESTIONS = [
  "How do I extend my D-2 visa?",
  "How do I open a bank account in Korea?",
  "Find me an IT internship",
  "How does health insurance work for students?",
];

export default function AiScreen() {
  const [messages, setMessages] = useState<AiTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setInput("");
    const history = messages;
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setBusy(true);

    const { data, error } = await api.post<{ reply: string }>("/ai/chat", {
      message,
      history,
    });
    setBusy(false);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: data?.reply || error || "Sorry, I couldn't answer that right now.",
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="p-4 pb-6"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && (
          <View className="items-center mt-10">
            <View className="bg-icon-500/15 rounded-full w-16 h-16 items-center justify-center">
              <Ionicons name="sparkles" size={28} color="#7c7cff" />
            </View>
            <Text className="text-white text-xl font-bold mt-4">Ask me anything</Text>
            <Text className="text-muted text-sm text-center mt-1 px-8">
              Visa, housing, banking, internships — I know Korea and I know ICOM's live
              listings.
            </Text>
            <View className="mt-6 w-full">
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => send(s)}
                  className="bg-card border border-border rounded-xl px-4 py-3 mb-2.5 active:border-icon-500"
                >
                  <Text className="text-icon-200">{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {messages.map((m, i) => (
          <View
            key={i}
            className={`mb-3 max-w-[85%] rounded-2xl px-4 py-3 ${
              m.role === "user"
                ? "self-end bg-icon-500"
                : "self-start bg-card border border-border"
            }`}
          >
            <Text className={m.role === "user" ? "text-white" : "text-[#e2e2f0] leading-6"}>
              {m.content}
            </Text>
          </View>
        ))}

        {busy && (
          <View className="self-start bg-card border border-border rounded-2xl px-4 py-3">
            <Text className="text-muted">Thinking…</Text>
          </View>
        )}
      </ScrollView>

      <View className="flex-row items-end border-t border-border bg-surface px-3 py-2.5">
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask about life in Korea…"
          placeholderTextColor="#5c5c73"
          multiline
          className="flex-1 bg-card border border-border rounded-2xl px-4 py-3 text-white max-h-32"
        />
        <Pressable
          onPress={() => send()}
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
