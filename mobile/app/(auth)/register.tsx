import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { Button, ErrorBanner, Input } from "@/components/ui";

const VISA_TYPES = ["D-2", "D-4", "D-10", "F-2", "Other"];

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [university, setUniversity] = useState("");
  const [country, setCountry] = useState("");
  const [visaType, setVisaType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError("Name, email, and password are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    const err = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      university: university.trim(),
      country: country.trim(),
      visa_type: visaType === "Other" ? "" : visaType,
    });
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
        <Text className="text-white text-3xl font-bold mb-1">Create account</Text>
        <Text className="text-muted text-base mb-8">
          Join thousands of international students in Korea.
        </Text>

        <ErrorBanner message={error} />

        <Input label="Full name" value={name} onChangeText={setName} placeholder="Your name" />
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
          placeholder="At least 6 characters"
          secureTextEntry
          autoComplete="new-password"
        />
        <Input
          label="University (optional)"
          value={university}
          onChangeText={setUniversity}
          placeholder="e.g. JBNU"
        />
        <Input
          label="Country (optional)"
          value={country}
          onChangeText={setCountry}
          placeholder="e.g. Uzbekistan"
        />

        <Text className="text-muted text-sm mb-2 font-medium">Visa type (optional)</Text>
        <View className="flex-row flex-wrap mb-4">
          {VISA_TYPES.map((v) => {
            const active = visaType === v;
            return (
              <Pressable
                key={v}
                onPress={() => setVisaType(active ? "" : v)}
                className={`rounded-full px-4 py-2 mr-2 mb-2 border ${
                  active ? "bg-icon-500 border-icon-500" : "bg-card border-border"
                }`}
              >
                <Text className={active ? "text-white font-semibold" : "text-muted"}>{v}</Text>
              </Pressable>
            );
          })}
        </View>

        <Button title="Create Account" onPress={submit} loading={busy} className="mt-2" />

        <View className="flex-row justify-center mt-6">
          <Text className="text-muted">Already have an account? </Text>
          <Link href="/(auth)/login" className="text-icon-400 font-semibold">
            Sign in
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
