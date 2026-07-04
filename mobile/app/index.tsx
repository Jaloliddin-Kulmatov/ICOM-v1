import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@/lib/auth";
import { LoadingScreen } from "@/components/ui";

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return <Redirect href={user ? "/(tabs)/home" : "/(auth)/login"} />;
}
