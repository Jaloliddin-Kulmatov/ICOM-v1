import React, { useEffect, useState } from "react";
import { Pressable, View, type ColorValue } from "react-native";
import { Redirect, Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useColors } from "@/lib/theme";
import { registerPush, scheduleVisaReminders } from "@/lib/notifications";
import { getItem } from "@/lib/storage";
import { WELCOME_SEEN, applyPendingWelcomeAnswers } from "@/lib/welcome";
import { Loading } from "@/components/ui";
import { useT } from "@/i18n";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

// Five tabs: Home, Jobs, Clubs, Chat, Guide.
// Messages and Profile live in the header.
export default function TabsLayout() {
  const { user, loading, refresh } = useAuth();
  const c = useColors();
  const { t } = useT();
  // The welcome runs once per phone, before sign-up.
  const [welcomeSeen, setWelcomeSeen] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    getItem(WELCOME_SEEN).then((v) => { if (live) setWelcomeSeen(!!v); });
    return () => { live = false; };
  }, []);

  // Answers given in the welcome before the account existed go to the profile now.
  useEffect(() => {
    if (!user) return;
    applyPendingWelcomeAnswers().then((saved) => { if (saved) refresh(); });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return;
    registerPush();
    scheduleVisaReminders(user.visa_expiry, user.visa_type);
  }, [user?.id, user?.visa_expiry]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <View style={{ flex: 1, backgroundColor: c.bg }}><Loading /></View>;
  if (!user) {
    if (welcomeSeen === null) return <View style={{ flex: 1, backgroundColor: c.bg }}><Loading /></View>;
    return <Redirect href={welcomeSeen ? "/sign-in" : "/welcome"} />;
  }

  const icon = (name: IconName) => function TabBarIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} size={size} color={color as string} />;
  };
  const headerRight = () => (
    <View style={{ flexDirection: "row", gap: 18, marginRight: 16 }}>
      <Pressable onPress={() => router.push("/messages")} accessibilityLabel={t("Messages")} hitSlop={8}>
        <Ionicons name="chatbubbles-outline" size={22} color={c.ink} />
      </Pressable>
      <Pressable onPress={() => router.push("/profile")} accessibilityLabel={t("Profile")} hitSlop={8}>
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
      <Tabs.Screen name="index" options={{ title: t("Home"), headerTitle: "ICOM", tabBarIcon: icon("home-outline") }} />
      <Tabs.Screen name="jobs" options={{ title: t("Jobs"), tabBarIcon: icon("briefcase-outline") }} />
      <Tabs.Screen name="clubs" options={{ title: t("Clubs"), tabBarIcon: icon("people-outline") }} />
      <Tabs.Screen name="chat" options={{ title: t("Chat"), tabBarIcon: icon("chatbox-ellipses-outline") }} />
      <Tabs.Screen name="guide" options={{ title: t("Guide"), tabBarIcon: icon("compass-outline") }} />
    </Tabs>
  );
}
