import React, { useState } from "react";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { Button, Card, Input, Screen, Text } from "@/components/ui";
import { useT } from "@/i18n";

// The email's link opens the website, where the new password is chosen.
// It works the same from the app or a computer.
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");
  const { t } = useT();

  const submit = async () => {
    setBusy(true); setError("");
    const { data, error: e } = await api.post<{ message: string }>("/auth/forgot-password", { email: email.trim() });
    setBusy(false);
    if (data) setSent(t("If an account uses that email, we've sent a link to reset the password. Check your inbox and spam folder."));
    else setError(e || t("Something went wrong. Please try again."));
  };

  return (
    <Screen>
      <Text color="muted">{t("Enter the email you signed up with. We'll send a link to choose a new password.")}</Text>
      {sent ? (
        <Card><Text>{sent}</Text></Card>
      ) : (
        <>
          <Input label={t("Email")} value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email"
            keyboardType="email-address" textContentType="emailAddress" placeholder="you@university.ac.kr" onSubmitEditing={submit} />
          {error ? <Text color="coral" variant="small">{error}</Text> : null}
          <Button title={t("Send reset link")} onPress={submit} loading={busy} disabled={!email.includes("@")} />
        </>
      )}
      <Button title={t("Back to sign in")} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
