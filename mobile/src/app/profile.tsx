import React, { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Alert, Platform, Switch, View } from "react-native";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as WebBrowser from "expo-web-browser";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { APP_VERSION, WEB_URL } from "@/lib/config";
import { CITIES, JOB_FIELDS, TOPIK_LEVELS, VISAS, daysUntil } from "@/lib/options";
import { scheduleVisaReminders } from "@/lib/notifications";
import { space, useColors } from "@/lib/theme";
import { Button, Card, Chip, ChipRow, Row, Screen, Text } from "@/components/ui";
import { DateField } from "@/components/date-field";

type CvFile = { filename: string; size: number; uploaded_at: string };

export default function Profile() {
  const { user, refresh, signOut, deleteAccount } = useAuth();
  const c = useColors();
  const [form, setForm] = useState(() => ({
    visa_type: user?.visa_type || "", visa_expiry: user?.visa_expiry || "", topik_level: user?.topik_level ?? null, job_field: user?.job_field || "", city: user?.city || "",
  }));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const cvReq = useApi<{ file: CvFile | null }>("/cv/me");
  const cv = cvReq.data?.file || null;
  const [cvBusy, setCvBusy] = useState(false);
  const alertsReq = useApi<{ enabled: boolean }>("/admin/jobs/alerts");
  const alerts = !!alertsReq.data?.enabled;

  if (!user) return null;
  const expiryInvalid = form.visa_expiry !== "" && daysUntil(form.visa_expiry) === null;

  const save = async () => {
    setSaving(true); setError(""); setMessage("");
    const { error: e } = await api.patch("/auth/me", form);
    setSaving(false);
    if (e) { setError(e); return; }
    const n = await scheduleVisaReminders(form.visa_expiry || undefined, form.visa_type);
    await refresh();
    const left = daysUntil(form.visa_expiry);
    setMessage(
      !form.visa_expiry || Platform.OS === "web" ? "Saved."
      : n > 0 ? `Saved. ${n} visa reminder${n === 1 ? "" : "s"} set on this phone.`
      : left !== null && left <= 7 ? "Saved. Your visa expires within a week, so no reminders are left to set."
      : "Saved. Turn on notifications for ICOM in your phone's settings to get visa reminders.");
  };

  const pickCv = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets?.length) return;
    const a = res.assets[0];
    if ((a.size || 0) > 2 * 1024 * 1024) { Alert.alert("File too large", "Please choose a PDF or .docx under 2 MB."); return; }
    const form = new FormData();
    if (Platform.OS === "web" && a.file) form.append("file", a.file);
    else form.append("file", { uri: a.uri, name: a.name, type: a.mimeType || "application/pdf" } as unknown as Blob);
    setCvBusy(true);
    const { data, error: e } = await api.upload<{ file: CvFile }>("/cv/me/file", form);
    setCvBusy(false);
    if (data) cvReq.setData(() => ({ file: data.file })); else Alert.alert("Upload failed", e || "Please try again.");
  };

  const toggleAlerts = async (on: boolean) => {
    alertsReq.setData(() => ({ enabled: on }));
    const { error: e } = await api.post("/admin/jobs/alerts", { enabled: on, field: form.job_field, city: form.city });
    if (e) alertsReq.setData(() => ({ enabled: !on }));
  };

  const confirmDelete = () => {
    Alert.alert("Delete your account?", "Your profile, CV, questions, answers and messages are deleted for good. This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete account", style: "destructive", onPress: async () => {
        const e = await deleteAccount();
        if (e) Alert.alert("Couldn't delete", e); else router.replace("/sign-in");
      } },
    ]);
  };

  return (
    <Screen>
      <Text variant="title">{user.name}</Text>
      <Text variant="small">{user.email}</Text>
      <Text variant="small">{[user.university?.toUpperCase(), user.visa_type, user.country].filter(Boolean).join(" · ")}</Text>

      <Card>
        <Text variant="heading">Career & visa</Text>
        <Text variant="small">Used to match internships to you and to remind you before your visa expires. Only you see this.</Text>
        <Text variant="small" style={{ fontWeight: "600", color: c.ink }}>Visa type</Text>
        <ChipRow>
          {VISAS.map((v) => <Chip key={v} label={v} selected={form.visa_type === v} onPress={() => setForm((f) => ({ ...f, visa_type: v }))} />)}
        </ChipRow>
        <DateField label="Visa expiry date" value={form.visa_expiry} onChange={(v) => setForm((f) => ({ ...f, visa_expiry: v }))}
          placeholder="Not set" />
        <Text variant="small" style={{ fontWeight: "600", color: c.ink }}>Korean level</Text>
        <ChipRow>
          {TOPIK_LEVELS.map((l) => (
            <Chip key={l} label={l === 0 ? "No TOPIK" : `TOPIK ${l}`} selected={form.topik_level === l}
              onPress={() => setForm((f) => ({ ...f, topik_level: f.topik_level === l ? null : l }))} />
          ))}
        </ChipRow>
        <Text variant="small" style={{ fontWeight: "600", color: c.ink }}>Field</Text>
        <ChipRow>
          {JOB_FIELDS.map((v) => <Chip key={v} label={v} selected={form.job_field === v} onPress={() => setForm((f) => ({ ...f, job_field: f.job_field === v ? "" : v }))} />)}
        </ChipRow>
        <Text variant="small" style={{ fontWeight: "600", color: c.ink }}>City</Text>
        <ChipRow>
          {CITIES.map((v) => <Chip key={v} label={v} selected={form.city === v} onPress={() => setForm((f) => ({ ...f, city: f.city === v ? "" : v }))} />)}
        </ChipRow>
        {error ? <Text color="coral" variant="small">{error}</Text> : null}
        {message ? <Text color="accent" variant="small">{message}</Text> : null}
        <Button title="Save" onPress={save} loading={saving} disabled={expiryInvalid} />
      </Card>

      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <View style={{ flex: 1, paddingRight: space.md }}>
            <Text variant="heading">Internship alerts</Text>
            <Text variant="small">A daily email with new internships in {[form.job_field || "any field", form.city || "all of Korea"].join(", ")}.</Text>
          </View>
          <Switch value={alerts} onValueChange={toggleAlerts} trackColor={{ true: c.accent, false: c.rule }} accessibilityLabel="Internship alerts" />
        </Row>
      </Card>

      <Card>
        <Text variant="heading">My CV</Text>
        <Text variant="small">{cv ? `${cv.filename} · ${Math.max(1, Math.round(cv.size / 1024))} KB` : "PDF or Word (.docx), up to 2 MB. Only you can see it."}</Text>
        <Button title={cv ? "Replace CV" : "Upload CV"} variant="secondary" icon="document-attach-outline" onPress={pickCv} loading={cvBusy} />
      </Card>

      <Card>
        <Button title="Set up my matches again" variant="ghost" icon="sparkles-outline" onPress={() => router.push("/welcome")} />
        <Button title="Privacy policy" variant="ghost" onPress={() => WebBrowser.openBrowserAsync(`${WEB_URL}/privacy`)} />
        <Button title="Terms and community rules" variant="ghost" onPress={() => WebBrowser.openBrowserAsync(`${WEB_URL}/terms`)} />
        <Button title="Sign out" variant="secondary" icon="log-out-outline" onPress={async () => { await signOut(); router.replace("/sign-in"); }} />
        <Button title="Delete account" variant="danger" icon="trash-outline" onPress={confirmDelete} />
      </Card>
      <Text variant="small" style={{ textAlign: "center" }}>ICOM {APP_VERSION}</Text>
    </Screen>
  );
}
