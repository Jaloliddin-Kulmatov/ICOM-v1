import React, { useState } from "react";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { CITIES } from "@/lib/options";
import { space, useColors } from "@/lib/theme";
import { Button, Card, Chip, ChipRow, Input, Screen, Text } from "@/components/ui";

const KOREAN = ["Not needed", "Basic", "Conversational", "Fluent"];
const EMPTY = { title: "", company: "", location: "", pay: "", schedule: "", korean: "", contact: "", description: "" };

/** Share a part-time job; an admin checks it before other students see it. */
export default function ShareJob() {
  const c = useColors();
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
    if (data) setDone(data.message); else setError(e || "Couldn't send it. Please try again.");
  };

  if (done) {
    return (
      <Screen>
        <Card>
          <Text variant="heading">Sent for review</Text>
          <Text>{done}</Text>
        </Card>
        <Button title="Share another" variant="secondary" onPress={() => { setForm(EMPTY); setDone(""); }} />
        <Button title="Back to jobs" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  const label = (t: string) => <Text variant="small" style={{ fontWeight: "600", color: c.ink }}>{t}</Text>;
  return (
    <Screen>
      <Text color="muted">Know a place that hires international students? An ICOM admin checks every post before others see it.</Text>
      <Input label="Job title *" value={form.title} onChangeText={set("title")} maxLength={120} placeholder="e.g. Café staff (weekends)" />
      <Input label="Place / employer *" value={form.company} onChangeText={set("company")} maxLength={100} placeholder="e.g. Bean Café near JBNU" />
      {label("City *")}
      <ChipRow>
        {CITIES.filter((x) => x !== "Remote").map((x) => <Chip key={x} label={x} selected={form.location === x} onPress={() => set("location")(x)} />)}
      </ChipRow>
      <Input label="Pay *" value={form.pay} onChangeText={set("pay")} maxLength={60} placeholder="e.g. ₩10,500 / hour" />
      <Input label="Days and hours" value={form.schedule} onChangeText={set("schedule")} maxLength={120} placeholder="e.g. Sat–Sun 10:00–18:00" />
      {label("Korean needed")}
      <ChipRow>
        {KOREAN.map((k) => <Chip key={k} label={k} selected={form.korean === k} onPress={() => set("korean")(form.korean === k ? "" : k)} />)}
      </ChipRow>
      <Input label="How to apply *" value={form.contact} onChangeText={set("contact")} maxLength={300} autoCapitalize="none"
        placeholder="KakaoTalk open chat link, website, or “ask for the manager”" />
      <Input label="Details" value={form.description} onChangeText={set("description")} maxLength={2000} multiline
        placeholder="What the work is, who it suits" style={{ minHeight: 100, textAlignVertical: "top", paddingTop: 12 }} />
      <Text variant="small">Please don&apos;t share other people&apos;s personal phone numbers.</Text>
      {error ? <Text color="coral" variant="small">{error}</Text> : null}
      <Button title="Send for review" icon="send-outline" onPress={submit} loading={busy} disabled={!ready} style={{ marginTop: space.sm }} />
    </Screen>
  );
}
