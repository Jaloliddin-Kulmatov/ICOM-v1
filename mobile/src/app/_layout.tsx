import React, { useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Linking, Platform, View, useColorScheme } from "react-native";
import * as Notifications from "expo-notifications";
import { AuthProvider } from "@/lib/auth";
import { space, useColors } from "@/lib/theme";
import { APP_VERSION } from "@/lib/config";
import { type AppConfig, fetchAppConfig, installCrashReporter, isOlder, reportError } from "@/lib/app-health";
import { Button, Text } from "@/components/ui";
import { Logo } from "@/components/logo";

installCrashReporter();

/** Shown instead of a white screen when a screen crashes. The crash is sent to the server log. */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  const c = useColors();
  useEffect(() => { reportError(error, { fatal: false }); }, [error]);
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", padding: space.xl, gap: space.md }}>
      <Logo size={56} />
      <Text variant="title" style={{ textAlign: "center" }}>Something went wrong</Text>
      <Text color="muted" style={{ textAlign: "center" }}>We&apos;ve been told about it. Try again, or go back to Home.</Text>
      <Button title="Try again" onPress={retry} style={{ alignSelf: "stretch" }} />
      <Button title="Go to Home" variant="ghost" onPress={() => router.replace("/")} style={{ alignSelf: "stretch" }} />
    </View>
  );
}

/** Blocks the app when this version is below the server's minimum (APP_MIN_VERSION on Render). */
function useRequiredUpdate(): AppConfig | null {
  const [cfg, setCfg] = useState<AppConfig | null>(null);
  useEffect(() => {
    if (Platform.OS === "web") return;
    let live = true;
    fetchAppConfig().then((c) => { if (live && c && isOlder(APP_VERSION, c.min_version)) setCfg(c); });
    return () => { live = false; };
  }, []);
  return cfg;
}

function UpdateRequired({ cfg }: { cfg: AppConfig }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", padding: space.xl, gap: space.md }}>
      <Logo size={56} />
      <Text variant="title" style={{ textAlign: "center" }}>Please update ICOM</Text>
      <Text color="muted" style={{ textAlign: "center" }}>
        {cfg.message || `This version (${APP_VERSION}) is no longer supported. The new version has fixes you need.`}
      </Text>
      <Button title="Update" icon="download-outline" style={{ alignSelf: "stretch" }}
        onPress={() => Linking.openURL(Platform.OS === "ios" ? cfg.ios_url : cfg.android_url)} />
    </View>
  );
}

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
  const update = useRequiredUpdate();
  if (update) return <UpdateRequired cfg={update} />;
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
        <Stack.Screen name="forgot-password" options={{ title: "Forgot password" }} />
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
