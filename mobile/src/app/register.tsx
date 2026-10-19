import React, { useState } from "react";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { space } from "@/lib/theme";
import { COUNTRIES, UNIVERSITIES, VISAS } from "@/lib/options";
import { Button, Chip, ChipRow, Input, Screen, Text } from "@/components/ui";

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", university: "jbnu", country: "", visa_type: "D-2" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setBusy(true); setError("");
    const err = await register(form);
    setBusy(false);
    if (err) setError(err); else router.replace("/");
  };

  return (
    <Screen>
      <Input label="Full name" value={form.name} onChangeText={set("name")} autoComplete="name" textContentType="name" placeholder="Linh Tran" />
      <Input label="Email" value={form.email} onChangeText={set("email")} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@university.ac.kr" />
      <Input label="Password" value={form.password} onChangeText={set("password")} secureTextEntry autoComplete="new-password" textContentType="newPassword" placeholder="At least 6 characters" />
      <Text variant="small" style={{ fontWeight: "600" }}>University</Text>
      <ChipRow>{UNIVERSITIES.map((u) => <Chip key={u.id} label={u.name} selected={form.university === u.id} onPress={() => set("university")(u.id)} />)}</ChipRow>
      <Text variant="small" style={{ fontWeight: "600" }}>Visa</Text>
      <ChipRow>{VISAS.map((v) => <Chip key={v} label={v} selected={form.visa_type === v} onPress={() => set("visa_type")(v)} />)}</ChipRow>
      <Text variant="small" style={{ fontWeight: "600" }}>Home country</Text>
      <ChipRow>{COUNTRIES.map((v) => <Chip key={v} label={v} selected={form.country === v} onPress={() => set("country")(v)} />)}</ChipRow>
      {error ? <Text color="coral" variant="small">{error}</Text> : null}
      <Button title="Create account" onPress={submit} loading={busy} disabled={!form.name || !form.email || form.password.length < 6} style={{ marginTop: space.sm }} />
      <Text variant="small" style={{ textAlign: "center" }}>By creating an account you agree to ICOM&apos;s Terms and Privacy Policy, including the community rules for Chat and Messages.</Text>
    </Screen>
  );
}
