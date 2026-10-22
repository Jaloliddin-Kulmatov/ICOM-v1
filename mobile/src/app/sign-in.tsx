import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { useColors, space } from "@/lib/theme";
import { Button, Input, Screen, Text } from "@/components/ui";
import { Logo } from "@/components/logo";
import { useT } from "@/i18n";

export default function SignIn() {
  const { signIn } = useAuth();
  const c = useColors();
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true); setError("");
    const err = await signIn(email, password);
    setBusy(false);
    if (err) setError(err); else router.replace("/");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen edges={["top", "bottom"]}>
        <View style={{ alignItems: "center", gap: space.sm, marginTop: space.xxl, marginBottom: space.lg }}>
          <Logo size={64} />
          <Text variant="display">{t("Welcome back")}</Text>
          <Text color="muted" style={{ textAlign: "center" }}>{t("Jobs, guides and a community for international students in Korea.")}</Text>
        </View>
        <Input label={t("Email")} value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email"
          keyboardType="email-address" textContentType="emailAddress" placeholder="you@university.ac.kr" />
        <Input label={t("Password")} value={password} onChangeText={setPassword} secureTextEntry autoComplete="password"
          textContentType="password" placeholder={t("Your password")} onSubmitEditing={submit} />
        {error ? <Text color="coral" variant="small">{error}</Text> : null}
        <Button title={t("Sign in")} onPress={submit} loading={busy} disabled={!email || !password} />
        <Link href="/forgot-password" style={{ color: c.accent, fontWeight: "700", textAlign: "center" }}>{t("Forgot password?")}</Link>
        <Text variant="small" style={{ textAlign: "center", marginTop: space.md }}>
          {t("New to ICOM?")} <Link href="/register" style={{ color: c.accent, fontWeight: "700" }}>{t("Create an account")}</Link>
        </Text>
      </Screen>
    </KeyboardAvoidingView>
  );
}
