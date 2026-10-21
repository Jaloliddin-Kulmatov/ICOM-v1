import React, { useEffect } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, useColorScheme } from "react-native";
import * as Notifications from "expo-notifications";
import { AuthProvider } from "@/lib/auth";
import { useColors } from "@/lib/theme";

// Tapping a notification opens the right screen.
function useNotificationTaps() {
  useEffect(() => {
    if (Platform.OS === "web") return;
    const open = (data: Record<string, unknown> | undefined) => {
      if (!data) return;
      if (data.type === "message" && data.conversation_id) router.push(`/messages/${data.conversation_id}`);
      else if (data.type === "answer" && data.post_id) router.push(`/chat/${data.post_id}`);
      else if (typeof data.url === "string") router.push(data.url as never);
    };
    const sub = Notifications.addNotificationResponseReceivedListener((r) =>
      open(r.notification.request.content.data as Record<string, unknown>));
    return () => sub.remove();
  }, []);
}

export default function RootLayout() {
  const c = useColors();
  const scheme = useColorScheme();
  useNotificationTaps();
  return (
    <AuthProvider>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{
        headerStyle: { backgroundColor: c.card }, headerTintColor: c.ink, headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: c.bg }, headerBackButtonDisplayMode: "minimal",
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="sign-in" options={{ title: "Sign in", headerShown: false }} />
        <Stack.Screen name="register" options={{ title: "Create account" }} />
        <Stack.Screen name="job/[id]" options={{ title: "Internship" }} />
        <Stack.Screen name="chat/[id]" options={{ title: "Question" }} />
        <Stack.Screen name="chat/new" options={{ title: "Ask a question", presentation: "modal" }} />
        <Stack.Screen name="club/[id]" options={{ title: "Club" }} />
        <Stack.Screen name="guide/[slug]" options={{ title: "Guide" }} />
        <Stack.Screen name="messages/index" options={{ title: "Messages" }} />
        <Stack.Screen name="messages/[id]" options={{ title: "" }} />
        <Stack.Screen name="profile" options={{ title: "Profile" }} />
      </Stack>
    </AuthProvider>
  );
}
