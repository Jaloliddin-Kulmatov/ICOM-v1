import React, { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Alert, Platform, Share, Switch, View } from "react-native";
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
import { LANGUAGES, useT } from "@/i18n";

type CvFile = { filename: string; size: number; uploaded_at: string };

export default function Profile() {
  const { user, refresh, signOut, deleteAccount } = useAuth();
  const c = useColors();
  const { t, tn, lang, setLang } = useT();
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
  const inviteReq = useApi<{ code: string; link: string; joined: number }>("/invites/me");
  const invite = inviteReq.data;
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
      !form.visa_expiry || Platform.OS === "web" ? t("Saved.")
      : n > 0 ? t("Saved. {count} set on this phone.", { count: tn("visa reminders", n) })
      : left !== null && left <= 7 ? t("Saved. Your visa expires within a week, so no reminders are left to set.")
      : t("Saved. Turn on notifications for ICOM in your phone's settings to get visa reminders."));
  };

  const pickCv = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets?.length) return;
    const a = res.assets[0];
    if ((a.size || 0) > 2 * 1024 * 1024) { Alert.alert(t("File too large"), t("Please choose a PDF or .docx under 2 MB.")); return; }
    const form = new FormData();
    if (Platform.OS === "web" && a.file) form.append("file", a.file);
    else form.append("file", { uri: a.uri, name: a.name, type: a.mimeType || "application/pdf" } as unknown as Blob);
    setCvBusy(true);
    const { data, error: e } = await api.upload<{ file: CvFile }>("/cv/me/file", form);
    setCvBusy(false);
    if (data) cvReq.setData(() => ({ file: data.file })); else Alert.alert(t("Upload failed"), e || t("Please try again."));
  };

  const toggleAlerts = async (on: boolean) => {
    alertsReq.setData(() => ({ enabled: on }));
    const { error: e } = await api.post("/admin/jobs/alerts", { enabled: on, field: form.job_field, city: form.city });
    if (e) alertsReq.setData(() => ({ enabled: !on }));
  };

  const confirmDelete = () => {
    Alert.alert(t("Delete your account?"), t("Your profile, CV, questions, answers and messages are deleted for good. This can't be undone."), [
      { text: t("Cancel"), style: "cancel" },
      { text: t("Delete account"), style: "destructive", onPress: async () => {
        const e = await deleteAccount();
        if (e) Alert.alert(t("Couldn't delete"), e); else router.replace("/sign-in");
      } },
    ]);
  };

  return (
    <Screen>
      <Text variant="title">{user.name}</Text>
      <Text variant="small">{user.email}</Text>
      <Text variant="small">{[user.university?.toUpperCase(), user.visa_type, user.country].filter(Boolean).join(" · ")}</Text>

      <Card>
        <Text variant="heading">{t("Language")}</Text>
        <ChipRow>
          {LANGUAGES.map((l) => <Chip key={l.code} label={l.name} selected={lang === l.code} onPress={() => setLang(l.code)} />)}
        </ChipRow>
      </Card>

      <Card>
        <Text variant="heading">{t("Career & visa")}</Text>
        <Text variant="small">{t("Used to match internships to you and to remind you before your visa expires. Only you see this.")}</Text>
        <Text variant="small" style={{ fontWeight: "600", color: c.ink }}>{t("Visa type")}</Text>
        <ChipRow>
          {VISAS.map((v) => <Chip key={v} label={v} selected={form.visa_type === v} onPress={() => setForm((f) => ({ ...f, visa_type: v }))} />)}
        </ChipRow>
        <DateField label={t("Visa expiry date")} value={form.visa_expiry} onChange={(v) => setForm((f) => ({ ...f, visa_expiry: v }))}
          placeholder={t("Not set")} />
        <Text variant="small" style={{ fontWeight: "600", color: c.ink }}>{t("Korean level")}</Text>
        <ChipRow>
          {TOPIK_LEVELS.map((l) => (
            <Chip key={l} label={l === 0 ? t("No TOPIK") : `TOPIK ${l}`} selected={form.topik_level === l}
              onPress={() => setForm((f) => ({ ...f, topik_level: f.topik_level === l ? null : l }))} />
          ))}
        </ChipRow>
        <Text variant="small" style={{ fontWeight: "600", color: c.ink }}>{t("Field")}</Text>
        <ChipRow>
          {JOB_FIELDS.map((v) => <Chip key={v} label={t(v)} selected={form.job_field === v} onPress={() => setForm((f) => ({ ...f, job_field: f.job_field === v ? "" : v }))} />)}
        </ChipRow>
        <Text variant="small" style={{ fontWeight: "600", color: c.ink }}>{t("City")}</Text>
        <ChipRow>
          {CITIES.map((v) => <Chip key={v} label={v} selected={form.city === v} onPress={() => setForm((f) => ({ ...f, city: f.city === v ? "" : v }))} />)}
        </ChipRow>
        {error ? <Text color="coral" variant="small">{error}</Text> : null}
        {message ? <Text color="accent" variant="small">{message}</Text> : null}
        <Button title={t("Save")} onPress={save} loading={saving} disabled={expiryInvalid} />
      </Card>

      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <View style={{ flex: 1, paddingRight: space.md }}>
            <Text variant="heading">{t("Internship alerts")}</Text>
            <Text variant="small">{t("A daily email with new internships in {where}.", { where: [form.job_field ? t(form.job_field) : t("any field"), form.city || t("all of Korea")].join(", ") })}</Text>
          </View>
          <Switch value={alerts} onValueChange={toggleAlerts} trackColor={{ true: c.accent, false: c.rule }} accessibilityLabel={t("Internship alerts")} />
        </Row>
      </Card>

      {invite ? (
        <Card>
          <Text variant="heading">{t("Invite friends to ICOM")}</Text>
          <Text variant="small">
            {invite.joined > 0 ? t("{count} joined with your invite. Thank you!", { count: tn("friends", invite.joined) })
              : t("Share your link in your class or country group chat. Your invite code: {code}", { code: invite.code })}
          </Text>
          <Button title={t("Share my invite link")} icon="share-social-outline"
            onPress={() => Share.share({ message: `${t("Join me on ICOM, the app for international students in Korea:")} ${invite.link}` })} />
        </Card>
      ) : null}

      <Card>
        <Text variant="heading">{t("My CV")}</Text>
        <Text variant="small">{cv ? `${cv.filename} · ${Math.max(1, Math.round(cv.size / 1024))} KB` : t("PDF or Word (.docx), up to 2 MB. Only you can see it.")}</Text>
        <Button title={cv ? t("Replace CV") : t("Upload CV")} variant="secondary" icon="document-attach-outline" onPress={pickCv} loading={cvBusy} />
        <Button title={t("Make a Korean CV (이력서)")} icon="language-outline" onPress={() => router.push("/cv-translate")} />
      </Card>

      <Card>
        <Button title={t("Set up my matches again")} variant="ghost" icon="sparkles-outline" onPress={() => router.push("/welcome")} />
        <Button title={t("Privacy policy")} variant="ghost" onPress={() => WebBrowser.openBrowserAsync(`${WEB_URL}/privacy`)} />
        <Button title={t("Terms and community rules")} variant="ghost" onPress={() => WebBrowser.openBrowserAsync(`${WEB_URL}/terms`)} />
        <Button title={t("Sign out")} variant="secondary" icon="log-out-outline" onPress={async () => { await signOut(); router.replace("/sign-in"); }} />
        <Button title={t("Delete account")} variant="danger" icon="trash-outline" onPress={confirmDelete} />
      </Card>
      <Text variant="small" style={{ textAlign: "center" }}>ICOM {APP_VERSION}</Text>
    </Screen>
  );
}
