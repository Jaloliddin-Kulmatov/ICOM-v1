import React, { useState } from "react";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { Button, Card, Input, Screen, Text } from "@/components/ui";

// The email's link opens the website, where the new password is chosen.
// It works the same from the app or a computer.
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  const submit = async () => {
    setBusy(true); setError("");
    const { data, error: e } = await api.post<{ message: string }>("/auth/forgot-password", { email: email.trim() });
    setBusy(false);
    if (data) setSent(data.message); else setError(e || "Something went wrong. Please try again.");
  };

  return (
    <Screen>
      <Text color="muted">Enter the email you signed up with. We&apos;ll send a link to choose a new password.</Text>
      {sent ? (
        <Card><Text>{sent}</Text></Card>
      ) : (
        <>
          <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email"
            keyboardType="email-address" textContentType="emailAddress" placeholder="you@university.ac.kr" onSubmitEditing={submit} />
          {error ? <Text color="coral" variant="small">{error}</Text> : null}
          <Button title="Send reset link" onPress={submit} loading={busy} disabled={!email.includes("@")} />
        </>
      )}
      <Button title="Back to sign in" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
