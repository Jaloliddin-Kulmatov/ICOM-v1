import React, { useEffect, useState } from "react";
import { Pressable, View, type ColorValue } from "react-native";
import { Redirect, Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useColors } from "@/lib/theme";
import { registerPush, scheduleVisaReminders } from "@/lib/notifications";
import { getItem, welcomeKey } from "@/lib/storage";
import { Loading } from "@/components/ui";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

// Five tabs: Home, Jobs, Clubs, Chat, Guide.
// Messages and Profile live in the header.
export default function TabsLayout() {
  const { user, loading } = useAuth();
  const c = useColors();
  // First open after sign-in: show the setup unless it was done on this phone or the profile is already filled in.
  const [welcomeFor, setWelcomeFor] = useState<{ id: number; show: boolean } | null>(null);

  useEffect(() => {
    if (!user) return;
    let live = true;
    getItem(welcomeKey(user.id)).then((v) => { if (live) setWelcomeFor({ id: user.id, show: !v && !user.job_field }); });
    return () => { live = false; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return;
    registerPush();
    scheduleVisaReminders(user.visa_expiry, user.visa_type);
  }, [user?.id, user?.visa_expiry]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <View style={{ flex: 1, backgroundColor: c.bg }}><Loading /></View>;
  if (!user) return <Redirect href="/sign-in" />;
  if (welcomeFor?.id !== user.id) return <View style={{ flex: 1, backgroundColor: c.bg }}><Loading /></View>;
  if (welcomeFor.show) return <Redirect href="/welcome" />;

  const icon = (name: IconName) => function TabBarIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} size={size} color={color as string} />;
  };
  const headerRight = () => (
    <View style={{ flexDirection: "row", gap: 18, marginRight: 16 }}>
      <Pressable onPress={() => router.push("/messages")} accessibilityLabel="Messages" hitSlop={8}>
        <Ionicons name="chatbubbles-outline" size={22} color={c.ink} />
      </Pressable>
      <Pressable onPress={() => router.push("/profile")} accessibilityLabel="Profile" hitSlop={8}>
        <Ionicons name="person-circle-outline" size={24} color={c.ink} />
      </Pressable>
    </View>
  );

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: c.accent, tabBarInactiveTintColor: c.muted,
      tabBarStyle: { backgroundColor: c.card, borderTopColor: c.rule },
      headerStyle: { backgroundColor: c.card }, headerTintColor: c.ink, headerTitleStyle: { fontWeight: "800" },
      headerShadowVisible: false, headerRight,
    }}>
      <Tabs.Screen name="index" options={{ title: "Home", headerTitle: "ICOM", tabBarIcon: icon("home-outline") }} />
      <Tabs.Screen name="jobs" options={{ title: "Jobs", tabBarIcon: icon("briefcase-outline") }} />
      <Tabs.Screen name="clubs" options={{ title: "Clubs", tabBarIcon: icon("people-outline") }} />
      <Tabs.Screen name="chat" options={{ title: "Chat", tabBarIcon: icon("chatbox-ellipses-outline") }} />
      <Tabs.Screen name="guide" options={{ title: "Guide", tabBarIcon: icon("compass-outline") }} />
    </Tabs>
  );
}
