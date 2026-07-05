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
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Club } from "@/lib/types";
import { Button, ErrorBanner, Input } from "@/components/ui";

const CATEGORIES = ["social", "sports", "study", "language", "culture", "volunteer", "other"];

export default function CreateClubScreen() {
  const { user } = useAuth();
  const [clubType, setClubType] = useState<"club" | "community">("community");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("social");
  const [country, setCountry] = useState(user?.country || "");
  const [university, setUniversity] = useState(user?.university || "");
  const [meetingTime, setMeetingTime] = useState("");
  const [location, setLocation] = useState("");
  const [kakaoLink, setKakaoLink] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error: err } = await api.post<{ club: Club }>("/clubs", {
      name: name.trim(),
      description: description.trim(),
      category,
      club_type: clubType,
      country: clubType === "community" ? country.trim() : "",
      university: clubType === "club" ? university.trim() : "",
      meeting_time: meetingTime.trim(),
      location: location.trim(),
      kakao_link: kakaoLink.trim(),
      contact: contact.trim(),
    });
    setBusy(false);
    if (err || !data?.club) {
      setError(err || "Could not create it.");
      return;
    }
    router.replace(`/community/${data.club.id}`);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerClassName="p-4 pb-10" keyboardShouldPersistTaps="handled">
        <ErrorBanner message={error} />

        <Text className="text-muted text-sm mb-2 font-medium">Type</Text>
        <View className="flex-row mb-4">
          {(
            [
              ["community", "🌍 Community", "Nationwide, e.g. by country"],
              ["club", "🏫 Club", "For your university"],
            ] as ["community" | "club", string, string][]
          ).map(([key, label, sub]) => {
            const active = clubType === key;
            return (
              <Pressable
                key={key}
                onPress={() => setClubType(key)}
                className={`flex-1 rounded-xl px-3 py-3 mr-2 border ${
                  active ? "bg-icon-500/20 border-icon-500" : "bg-card border-border"
                }`}
              >
                <Text className={active ? "text-white font-semibold" : "text-muted"}>
                  {label}
                </Text>
                <Text className="text-muted text-xs mt-0.5">{sub}</Text>
              </Pressable>
            );
          })}
        </View>

        <Input
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder={clubType === "community" ? "e.g. Uzbek Students in Korea" : "e.g. JBNU Hiking Club"}
        />
        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="What is it about? Who should join?"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={{ minHeight: 90 }}
        />

        <Text className="text-muted text-sm mb-2 font-medium">Category</Text>
        <View className="flex-row flex-wrap mb-4">
          {CATEGORIES.map((c) => {
            const active = category === c;
            return (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                className={`rounded-full px-3.5 py-1.5 mr-2 mb-2 border ${
                  active ? "bg-icon-500 border-icon-500" : "bg-card border-border"
                }`}
              >
                <Text className={`capitalize ${active ? "text-white font-semibold" : "text-muted"}`}>
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {clubType === "community" ? (
          <Input
            label="Country"
            value={country}
            onChangeText={setCountry}
            placeholder="e.g. Uzbekistan"
          />
        ) : (
          <Input
            label="University"
            value={university}
            onChangeText={setUniversity}
            placeholder="e.g. JBNU"
          />
        )}
        <Input
          label="Meeting time (optional)"
          value={meetingTime}
          onChangeText={setMeetingTime}
          placeholder="e.g. Saturdays 2pm"
        />
        <Input
          label="Location (optional)"
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Student Union Building"
        />
        <Input
          label="KakaoTalk open-chat link (optional, members-only)"
          value={kakaoLink}
          onChangeText={setKakaoLink}
          placeholder="https://open.kakao.com/…"
          autoCapitalize="none"
        />
        <Input
          label="Contact (optional, members-only)"
          value={contact}
          onChangeText={setContact}
          placeholder="e.g. @yourkakaoid"
        />

        <Button title="Create" onPress={submit} loading={busy} className="mt-2" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
