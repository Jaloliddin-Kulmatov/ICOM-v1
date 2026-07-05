import React, { useCallback, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Club, ClubMember } from "@/lib/types";
import { Avatar, Badge, Button, Card, EmptyState, ErrorBanner, LoadingScreen } from "@/components/ui";

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isMember = !!club && (club.my_status === "approved" || club.is_creator);

  const load = useCallback(async () => {
    const { data, error: err } = await api.get<{ club: Club }>(`/clubs/${id}`);
    if (!data?.club) {
      setLoadError(err || "Not found.");
      return;
    }
    setClub(data.club);
    if (data.club.my_status === "approved" || data.club.is_creator) {
      const m = await api.get<{ members: ClubMember[] }>(`/clubs/${id}/members`);
      if (m.data) setMembers(m.data.members);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const join = async () => {
    setBusy(true);
    setError(null);
    const { data, error: err } = await api.post<{ club: Club }>(`/clubs/${id}/request`);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    if (data?.club) setClub(data.club);
    await load();
  };

  const leave = () => {
    Alert.alert("Leave?", `You'll lose access to the members chat of ${club?.name}.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          const { data, error: err } = await api.post<{ club: Club }>(`/clubs/${id}/leave`);
          if (err) {
            setError(err);
            return;
          }
          if (data?.club) setClub(data.club);
          setMembers([]);
        },
      },
    ]);
  };

  if (loadError) return <EmptyState title="Couldn't load" subtitle={loadError} />;
  if (!club) return <LoadingScreen />;

  return (
    <>
      <Stack.Screen
        options={{ title: club.club_type === "community" ? "Community" : "Club" }}
      />
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-12">
        <Text className="text-white text-2xl font-bold">{club.name}</Text>
        <View className="flex-row flex-wrap mt-2">
          <Badge
            label={club.club_type === "community" ? "Community" : "Club"}
            tone="indigo"
          />
          {club.category ? <Badge label={club.category} tone="gray" /> : null}
          {club.club_type === "community"
            ? club.country && <Badge label={club.country} tone="gray" />
            : club.university && <Badge label={club.university} tone="gray" />}
        </View>

        {club.description ? (
          <Text className="text-[#c9c9dc] leading-6 mt-3">{club.description}</Text>
        ) : null}

        <Card className="mt-4">
          {(
            [
              ["Members", String(club.member_count)],
              ["Created by", club.creator_name || "—"],
              ["Meets", club.meeting_time || null],
              ["Location", club.location || null],
            ] as [string, string | null][]
          )
            .filter(([, v]) => v)
            .map(([label, value], i) => (
              <View
                key={label}
                className={`flex-row justify-between py-2.5 ${i > 0 ? "border-t border-border" : ""}`}
              >
                <Text className="text-muted">{label}</Text>
                <Text className="text-white font-medium flex-1 text-right" numberOfLines={1}>
                  {value}
                </Text>
              </View>
            ))}
          {club.website ? (
            <Pressable
              onPress={() => Linking.openURL(club.website)}
              className="flex-row justify-between py-2.5 border-t border-border"
            >
              <Text className="text-muted">Website</Text>
              <Text className="text-icon-400 font-medium">Open ↗</Text>
            </Pressable>
          ) : null}
        </Card>

        <ErrorBanner message={error} />

        {isMember ? (
          <>
            <Button
              title="Open Members Chat"
              onPress={() => router.push(`/community/${club.id}/chat`)}
              className="mt-4"
            />
            {(club.kakao_link || club.contact) && (
              <Card className="mt-4">
                <Text className="text-white font-semibold mb-2">Members-only info</Text>
                {club.kakao_link ? (
                  <Pressable
                    onPress={() => Linking.openURL(club.kakao_link!)}
                    className="flex-row items-center py-1.5"
                  >
                    <Ionicons name="chatbubble-ellipses" size={16} color="#fbbf24" />
                    <Text className="text-icon-300 ml-2">Open KakaoTalk group ↗</Text>
                  </Pressable>
                ) : null}
                {club.contact ? (
                  <Text className="text-muted mt-1">Contact: {club.contact}</Text>
                ) : null}
              </Card>
            )}
            {!club.is_creator && (
              <Button title="Leave" variant="ghost" onPress={leave} className="mt-3" />
            )}
          </>
        ) : (
          <Button
            title={club.my_status === "pending" ? "Request Pending…" : "Join"}
            onPress={join}
            loading={busy}
            disabled={club.my_status === "pending"}
            className="mt-4"
          />
        )}

        {isMember && members.length > 0 && (
          <>
            <Text className="text-white text-lg font-bold mt-6 mb-3">Members</Text>
            <Card>
              {members.map((m, i) => (
                <View
                  key={`${m.user_id}-${m.membership_id ?? "creator"}`}
                  className={`flex-row items-center py-2.5 ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <Avatar name={m.name} size={32} />
                  <View className="ml-2.5 flex-1">
                    <Text className="text-white text-sm font-medium" numberOfLines={1}>
                      {m.name}
                      {m.user_id === user?.id ? " (you)" : ""}
                    </Text>
                    <Text className="text-muted text-xs" numberOfLines={1}>
                      {[m.university, m.country].filter(Boolean).join(" · ") || "Member"}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </>
  );
}
