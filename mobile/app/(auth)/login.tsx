import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { Button, ErrorBanner, Input } from "@/components/ui";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setBusy(true);
    setError(null);
    const err = await login(email.trim(), password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    router.replace("/(tabs)/home");
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-10">
          <Image
            source={require("../../assets/icon.png")}
            style={{ width: 72, height: 72, borderRadius: 18 }}
          />
          <Text className="text-white text-3xl font-bold mt-4">ICOM</Text>
          <Text className="text-muted text-base mt-1 text-center">
            International Community in Korea
          </Text>
        </View>

        <ErrorBanner message={error} />

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@university.ac.kr"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          autoComplete="password"
          onSubmitEditing={submit}
        />

        <Button title="Sign In" onPress={submit} loading={busy} className="mt-2" />

        <View className="flex-row justify-center mt-6">
          <Text className="text-muted">New to ICOM? </Text>
          <Link href="/(auth)/register" className="text-icon-400 font-semibold">
            Create an account
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
