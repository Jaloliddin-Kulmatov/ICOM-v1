import "../global.css";
import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/lib/auth";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0d0d1a" },
          headerTintColor: "#ffffff",
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: "#050508" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="internships/[id]" options={{ title: "Internship" }} />
        <Stack.Screen name="chat/[id]" options={{ title: "Question" }} />
        <Stack.Screen
          name="chat/new"
          options={{ title: "Ask a Question", presentation: "modal" }}
        />
        <Stack.Screen name="ai" options={{ title: "AI Assistant" }} />
        <Stack.Screen name="search" options={{ title: "Search" }} />
        <Stack.Screen name="community/[id]/index" options={{ title: "Community" }} />
        <Stack.Screen name="community/[id]/chat" options={{ title: "Members Chat" }} />
        <Stack.Screen
          name="community/new"
          options={{ title: "Create Club or Community", presentation: "modal" }}
        />
        <Stack.Screen name="community/post/[id]" options={{ title: "Post" }} />
        <Stack.Screen name="support/index" options={{ title: "Support Guides" }} />
        <Stack.Screen name="support/[slug]" options={{ title: "Guide" }} />
        <Stack.Screen name="universities" options={{ title: "Universities" }} />
        <Stack.Screen name="ambassador" options={{ title: "Become an Ambassador" }} />
        <Stack.Screen name="daily-life" options={{ title: "Daily Life" }} />
        <Stack.Screen name="feedback" options={{ title: "Feedback" }} />
        <Stack.Screen name="bookmarks" options={{ title: "Saved Internships" }} />
      </Stack>
    </AuthProvider>
  );
}
