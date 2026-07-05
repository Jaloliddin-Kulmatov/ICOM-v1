import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { Button, ErrorBanner, Input } from "@/components/ui";

export default function FeedbackScreen() {
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!message.trim()) {
      setError("Please write a message before submitting.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await api.post("/feedback", {
      message: message.trim(),
      rating: rating || null,
      page_url: "mobile-app",
    });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <View className="bg-emerald-500/15 rounded-full w-16 h-16 items-center justify-center">
          <Ionicons name="heart" size={28} color="#34d399" />
        </View>
        <Text className="text-white text-xl font-bold mt-4">Thanks for the feedback!</Text>
        <Text className="text-muted text-sm text-center mt-2">
          We read every message — it directly shapes what we build next.
        </Text>
        <Button title="Back" variant="outline" onPress={() => router.back()} className="mt-6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerClassName="p-4 pb-10" keyboardShouldPersistTaps="handled">
        <Text className="text-white text-2xl font-bold">How's ICOM?</Text>
        <Text className="text-muted mt-1 mb-6">
          Found a bug? Missing a feature? Tell us — we ship fast.
        </Text>

        <ErrorBanner message={error} />

        <Text className="text-muted text-sm mb-2 font-medium">Rating (optional)</Text>
        <View className="flex-row mb-5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n === rating ? 0 : n)} className="mr-2 p-1">
              <Ionicons
                name={n <= rating ? "star" : "star-outline"}
                size={30}
                color={n <= rating ? "#fbbf24" : "#5c5c73"}
              />
            </Pressable>
          ))}
        </View>

        <Input
          label="Your message"
          value={message}
          onChangeText={setMessage}
          placeholder="What should we improve?"
          multiline
          numberOfLines={6}
          maxLength={2000}
          textAlignVertical="top"
          style={{ minHeight: 140 }}
        />

        <Button title="Send Feedback" onPress={submit} loading={busy} className="mt-2" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
