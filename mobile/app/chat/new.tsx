import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { ChatPost } from "@/lib/types";
import { Button, ErrorBanner, Input } from "@/components/ui";

// Backend caps image_url at ~600K chars (≈450KB binary as base64).
const MAX_DATA_URL_CHARS = 590_000;

export default function NewQuestionScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [scope, setScope] = useState<"all" | "university">("all");
  const [image, setImage] = useState<string | null>(null); // data URL
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const hasUniversity = !!user?.university?.trim();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.5,
      base64: true,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    const asset = result.assets[0];
    const dataUrl = `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`;
    if (dataUrl.length > MAX_DATA_URL_CHARS) {
      setError("Image is too large (max ~450 KB). Pick a smaller one.");
      return;
    }
    setError(null);
    setImage(dataUrl);
  };

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and question are both required.");
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error: err } = await api.post<{ post: ChatPost }>("/chat/posts", {
      title: title.trim(),
      content: content.trim(),
      scope: scope === "university" ? "university" : "all",
      image_url: image || "",
    });
    setBusy(false);
    if (err || !data?.post) {
      setError(err || "Could not create the post.");
      return;
    }
    router.replace(`/chat/${data.post.id}`);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerClassName="p-4 pb-10" keyboardShouldPersistTaps="handled">
        <ErrorBanner message={error} />

        <Input
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. How do I extend my D-2 visa?"
          maxLength={200}
        />
        <Input
          label="Your question"
          value={content}
          onChangeText={setContent}
          placeholder="Add details so others can help you better…"
          multiline
          numberOfLines={6}
          maxLength={5000}
          textAlignVertical="top"
          style={{ minHeight: 140 }}
        />

        <Text className="text-muted text-sm mb-2 font-medium">Who can see this?</Text>
        <View className="flex-row mb-6">
          {(
            [
              ["all", "🌏 All Korea"],
              ["university", hasUniversity ? `🏫 ${user!.university} only` : "🏫 My university"],
            ] as ["all" | "university", string][]
          ).map(([key, label]) => {
            const active = scope === key;
            const disabled = key === "university" && !hasUniversity;
            return (
              <Pressable
                key={key}
                disabled={disabled}
                onPress={() => setScope(key)}
                className={`rounded-full px-4 py-2 mr-2 border ${
                  active ? "bg-icon-500 border-icon-500" : "bg-card border-border"
                } ${disabled ? "opacity-40" : ""}`}
              >
                <Text className={active ? "text-white font-semibold" : "text-muted"}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        {!hasUniversity && (
          <Text className="text-muted text-xs -mt-4 mb-4">
            Set your university in Profile to post to a university-only chat.
          </Text>
        )}

        <Text className="text-muted text-sm mb-2 font-medium">Photo (optional)</Text>
        {image ? (
          <View className="mb-5">
            <Image
              source={{ uri: image }}
              className="w-full rounded-2xl"
              style={{ height: 200 }}
              resizeMode="cover"
            />
            <Pressable
              onPress={() => setImage(null)}
              className="absolute top-2 right-2 bg-black/70 rounded-full p-2"
            >
              <Ionicons name="close" size={18} color="#fff" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={pickImage}
            className="border border-dashed border-border rounded-2xl py-6 items-center mb-5 active:border-icon-500"
          >
            <Ionicons name="image-outline" size={26} color="#8b8ba3" />
            <Text className="text-muted text-sm mt-1.5">Attach a photo</Text>
          </Pressable>
        )}

        <Button title="Post Question" onPress={submit} loading={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
