import React from "react";
import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/lib/auth";

export default function AuthLayout() {
  const { user, loading } = useAuth();
  // Already signed in — skip straight to the app.
  if (!loading && user) return <Redirect href="/(tabs)/home" />;
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#050508" } }}
    />
  );
}
