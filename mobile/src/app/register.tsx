import React, { useEffect, useState } from "react";
import { Link, router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { space, useColors } from "@/lib/theme";
import { loadWelcomeAnswers } from "@/lib/welcome";
import { COUNTRIES, UNIVERSITIES, VISAS } from "@/lib/options";
import { Button, Chip, ChipRow, Input, Screen, Text } from "@/components/ui";
import { useT } from "@/i18n";

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", university: "jbnu", country: "", visa_type: "D-2", ref: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const c = useColors();
  const { t } = useT();

  // The visa picked in the welcome is already chosen here.
  useEffect(() => {
    loadWelcomeAnswers().then((a) => { if (a?.visa_type) setForm((f) => ({ ...f, visa_type: a.visa_type })); });
  }, []);

  const submit = async () => {
    setBusy(true); setError("");
    const err = await register(form);
    setBusy(false);
    if (err) setError(err); else router.replace("/");
  };

  return (
    <Screen>
      <Input label={t("Full name")} value={form.name} onChangeText={set("name")} autoComplete="name" textContentType="name" placeholder="Linh Tran" />
      <Input label={t("Email")} value={form.email} onChangeText={set("email")} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@university.ac.kr" />
      <Input label={t("Password")} value={form.password} onChangeText={set("password")} secureTextEntry autoComplete="new-password" textContentType="newPassword" placeholder={t("At least 6 characters")} />
      <Text variant="small" style={{ fontWeight: "600" }}>{t("University")}</Text>
      <ChipRow>{UNIVERSITIES.map((u) => <Chip key={u.id} label={u.name} selected={form.university === u.id} onPress={() => set("university")(u.id)} />)}</ChipRow>
      <Text variant="small" style={{ fontWeight: "600" }}>{t("Visa")}</Text>
      <ChipRow>{VISAS.map((v) => <Chip key={v} label={v} selected={form.visa_type === v} onPress={() => set("visa_type")(v)} />)}</ChipRow>
      <Text variant="small" style={{ fontWeight: "600" }}>{t("Home country")}</Text>
      <ChipRow>{COUNTRIES.map((v) => <Chip key={v} label={v} selected={form.country === v} onPress={() => set("country")(v)} />)}</ChipRow>
      <Input label={t("Invite code (optional)")} value={form.ref} onChangeText={set("ref")} autoCapitalize="none" autoCorrect={false} maxLength={40}
        placeholder={t("From the friend who invited you, e.g. aziz-k3f")} />
      {error ? <Text color="coral" variant="small">{error}</Text> : null}
      <Button title={t("Create account")} onPress={submit} loading={busy} disabled={!form.name || !form.email || form.password.length < 6} style={{ marginTop: space.sm }} />
      <Text variant="small" style={{ textAlign: "center" }}>
        {t("Already have an account?")} <Link href="/sign-in" replace style={{ color: c.accent, fontWeight: "700" }}>{t("Sign in")}</Link>
      </Text>
      <Text variant="small" style={{ textAlign: "center" }}>{t("By creating an account you agree to ICOM's Terms and Privacy Policy, including the community rules for Chat and Messages.")}</Text>
    </Screen>
  );
}
