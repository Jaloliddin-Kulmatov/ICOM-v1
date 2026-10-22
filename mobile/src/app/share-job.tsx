import React, { useState } from "react";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { CITIES } from "@/lib/options";
import { space, useColors } from "@/lib/theme";
import { Button, Card, Chip, ChipRow, Input, Screen, Text } from "@/components/ui";
import { useT } from "@/i18n";

const KOREAN = ["Not needed", "Basic", "Conversational", "Fluent"];
const EMPTY = { title: "", company: "", location: "", pay: "", schedule: "", korean: "", contact: "", description: "" };

/** Share a part-time job; an admin checks it before other students see it. */
export default function ShareJob() {
  const c = useColors();
  const { t } = useT();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const set = (k: keyof typeof EMPTY) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const ready = form.title.trim() && form.company.trim() && form.location && form.pay.trim() && form.contact.trim();

  const submit = async () => {
    setBusy(true); setError("");
    const { data, error: e } = await api.post<{ message: string }>("/admin/jobs/submit", form);
    setBusy(false);
    if (data) setDone(t("Thanks! An admin will check it, usually within a day.")); else setError(e || t("Couldn't send it. Please try again."));
  };

  if (done) {
    return (
      <Screen>
        <Card>
          <Text variant="heading">{t("Sent for review")}</Text>
          <Text>{done}</Text>
        </Card>
        <Button title={t("Share another")} variant="secondary" onPress={() => { setForm(EMPTY); setDone(""); }} />
        <Button title={t("Back to jobs")} variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  const label = (text: string) => <Text variant="small" style={{ fontWeight: "600", color: c.ink }}>{text}</Text>;
  return (
    <Screen>
      <Text color="muted">{t("Know a place that hires international students? An ICOM admin checks every post before others see it.")}</Text>
      <Input label={`${t("Job title")} *`} value={form.title} onChangeText={set("title")} maxLength={120} placeholder={t("e.g. Café staff (weekends)")} />
      <Input label={`${t("Place / employer")} *`} value={form.company} onChangeText={set("company")} maxLength={100} placeholder={t("e.g. Bean Café near JBNU")} />
      {label(`${t("City")} *`)}
      <ChipRow>
        {CITIES.filter((x) => x !== "Remote").map((x) => <Chip key={x} label={x} selected={form.location === x} onPress={() => set("location")(x)} />)}
      </ChipRow>
      <Input label={`${t("Pay")} *`} value={form.pay} onChangeText={set("pay")} maxLength={60} placeholder={t("e.g. ₩10,500 / hour")} />
      <Input label={t("Days and hours")} value={form.schedule} onChangeText={set("schedule")} maxLength={120} placeholder={t("e.g. Sat–Sun 10:00–18:00")} />
      {label(t("Korean needed"))}
      <ChipRow>
        {KOREAN.map((k) => <Chip key={k} label={t(k)} selected={form.korean === k} onPress={() => set("korean")(form.korean === k ? "" : k)} />)}
      </ChipRow>
      <Input label={`${t("How to apply")} *`} value={form.contact} onChangeText={set("contact")} maxLength={300} autoCapitalize="none"
        placeholder={t("KakaoTalk open chat link, website, or “ask for the manager”")} />
      <Input label={t("Details")} value={form.description} onChangeText={set("description")} maxLength={2000} multiline
        placeholder={t("What the work is, who it suits")} style={{ minHeight: 100, textAlignVertical: "top", paddingTop: 12 }} />
      <Text variant="small">{t("Please don't share other people's personal phone numbers.")}</Text>
      {error ? <Text color="coral" variant="small">{error}</Text> : null}
      <Button title={t("Send for review")} icon="send-outline" onPress={submit} loading={busy} disabled={!ready} style={{ marginTop: space.sm }} />
    </Screen>
  );
}
