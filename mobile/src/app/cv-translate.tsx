import React, { useState } from "react";
import { Alert, Platform, Share, View } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { space, useColors } from "@/lib/theme";
import { Button, Card, ErrorBox, Input, Screen, Segmented, Text } from "@/components/ui";
import { Rise } from "@/components/motion";
import { useT } from "@/i18n";

type Item = Record<string, string>;
type CV = {
  full_name: string; headline: string; nationality: string; visa: string; email: string; phone: string; location: string;
  summary: string; education: Item[]; experience: Item[]; skills: string[]; languages: Item[]; certifications: Item[]; links: Item[];
};
type Target = "ko" | "en";

// Section names follow the CV's language, not the app's: a Korean 이력서 always says 학력.
const L = {
  ko: { education: "학력", experience: "경력", summary: "자기소개", languages: "어학", certifications: "자격증", skills: "기술" },
  en: { education: "Education", experience: "Experience", summary: "Summary", languages: "Languages", certifications: "Certifications", skills: "Skills" },
};
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const period = (it: Item) => (it.start || it.end ? `${it.start || ""} ~ ${it.end || ""}` : "");
const head = (key: "education" | "experience", it: Item) =>
  (key === "education" ? [it.school, it.degree, it.field] : [it.company, it.title, it.location]).filter(Boolean).join(" · ");
const contact = (cv: CV) => [cv.nationality, cv.visa, cv.phone, cv.email, cv.location].filter(Boolean).join(" · ");

function asText(cv: CV, target: Target): string {
  const l = L[target];
  const out: string[] = [cv.full_name, cv.headline, contact(cv), ""];
  if (cv.summary) out.push(`[${l.summary}]`, cv.summary, "");
  for (const key of ["education", "experience"] as const) {
    if (!cv[key].length) continue;
    out.push(`[${l[key]}]`);
    for (const it of cv[key]) {
      out.push(`${period(it)}  ${head(key, it)}`.trim());
      if (it.details) out.push(it.details);
    }
    out.push("");
  }
  if (cv.languages.length) out.push(`[${l.languages}]`, cv.languages.map((x) => `${x.name} ${x.level}`.trim()).join(", "), "");
  if (cv.certifications.length) out.push(`[${l.certifications}]`, cv.certifications.map((x) => `${x.name} ${x.year}`.trim()).join(", "), "");
  if (cv.skills.length) out.push(`[${l.skills}]`, cv.skills.join(", "));
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Turn the uploaded CV (or pasted text) into a Korean 이력서 or an English CV, then save it as Word. */
export default function CVTranslate() {
  const c = useColors();
  const { t } = useT();
  const fileReq = useApi<{ file: { filename: string } | null }>("/cv/me");
  const hasFile = !!fileReq.data?.file;
  const [target, setTarget] = useState<Target>("ko");
  const [source, setSource] = useState<"file" | "text">("file");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ cv: CV; target: Target } | null>(null);
  const from = hasFile ? source : "text";

  const translate = async () => {
    setBusy(true); setError(""); setResult(null);
    const { data, error: e } = await api.post<{ cv: CV; target: Target }>("/cv/me/translate", { target, source: from, text });
    setBusy(false);
    if (data) setResult(data); else setError(e || t("Couldn't translate your CV. Please try again."));
  };

  const saveWord = async () => {
    if (!result) return;
    setSaving(true);
    const { bytes, error: e } = await api.postForFile("/cv/me/export", { cv: result.cv, lang: result.target });
    if (!bytes) { setSaving(false); Alert.alert(t("Couldn't make the Word file"), e || t("Please try again.")); return; }
    const name = `${(result.cv.full_name || "ICOM").replace(/[^\p{L}\p{N}]+/gu, "_")}_${result.target === "ko" ? "이력서" : "CV"}.docx`;
    try {
      if (Platform.OS === "web") {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([bytes as BlobPart], { type: DOCX }));
        a.download = name; a.click();
      } else {
        const file = new File(Paths.cache, name);
        file.create({ overwrite: true });
        file.write(bytes);
        await Sharing.shareAsync(file.uri, { mimeType: DOCX, UTI: "org.openxmlformats.wordprocessingml.document", dialogTitle: name });
      }
    } catch {
      Alert.alert(t("Couldn't make the Word file"), t("Please try again."));
    }
    setSaving(false);
  };

  const shareText = () => { if (result) Share.share({ message: asText(result.cv, result.target) }); };

  const cv = result?.cv;
  const l = L[result?.target || target];
  return (
    <Screen>
      <Text color="muted">{t("Turn your CV into a Korean 이력서 (or a clean English CV) in the format Korean companies expect.")}</Text>
      <Segmented value={target} onChange={(v) => { setTarget(v); setResult(null); }}
        options={[{ value: "ko", label: "한국어 이력서" }, { value: "en", label: "English CV" }]} />
      {hasFile && (
        <Segmented value={source} onChange={setSource} options={[
          { value: "file", label: t("My uploaded CV"), icon: "document-text-outline" },
          { value: "text", label: t("Paste text"), icon: "clipboard-outline" },
        ]} />
      )}
      {from === "text" && (
        <Input value={text} onChangeText={setText} multiline maxLength={12000} accessibilityLabel={t("Your CV text")}
          placeholder={t("Paste your CV here: education, work, skills, languages…")}
          style={{ minHeight: 180, paddingTop: 12, textAlignVertical: "top" }} />
      )}
      <Button title={busy ? t("Translating… (about 20 seconds)") : target === "ko" ? t("Make my Korean CV") : t("Make my English CV")}
        icon="sparkles-outline" onPress={translate} loading={busy} disabled={from === "text" && text.trim().length < 40} />
      <Text variant="small" style={{ textAlign: "center" }}>{t("AI only rewrites what is in your CV. It never adds jobs or skills.")}</Text>
      {error ? <ErrorBox message={error} /> : null}

      {cv && (
        <Rise>
          <Card>
            <Text variant="title">{cv.full_name || "—"}</Text>
            {cv.headline ? <Text color="muted">{cv.headline}</Text> : null}
            {contact(cv) ? <Text variant="small">{contact(cv)}</Text> : null}
            {cv.summary ? <Section title={l.summary}><Text>{cv.summary}</Text></Section> : null}
            {(["education", "experience"] as const).map((key) => cv[key].length > 0 && (
              <Section key={key} title={l[key]}>
                {cv[key].map((it, i) => (
                  <View key={i} style={{ gap: 2, paddingVertical: 6, borderTopWidth: i ? 1 : 0, borderColor: c.rule }}>
                    {period(it) ? <Text variant="small">{period(it)}</Text> : null}
                    <Text style={{ fontWeight: "700" }}>{head(key, it)}</Text>
                    {it.details ? <Text variant="small">{it.details}</Text> : null}
                  </View>
                ))}
              </Section>
            ))}
            {cv.languages.length > 0 && <Section title={l.languages}><Text>{cv.languages.map((x) => `${x.name} ${x.level}`.trim()).join(", ")}</Text></Section>}
            {cv.certifications.length > 0 && <Section title={l.certifications}><Text>{cv.certifications.map((x) => `${x.name} ${x.year}`.trim()).join(", ")}</Text></Section>}
            {cv.skills.length > 0 && <Section title={l.skills}><Text>{cv.skills.join(", ")}</Text></Section>}
          </Card>
          <View style={{ gap: space.sm, marginTop: space.md }}>
            <Button title={t("Save as Word")} icon="document-text-outline" onPress={saveWord} loading={saving} />
            <Button title={t("Share as text")} variant="secondary" icon="share-outline" onPress={shareText} />
            <Text variant="small" style={{ textAlign: "center" }}>{t("Check names, dates and titles before you send it. AI translation can make mistakes.")}</Text>
          </View>
        </Rise>
      )}
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: space.sm, gap: 4 }}>
      <Text variant="small" color="accent" style={{ fontWeight: "700" }}>{title}</Text>
      {children}
    </View>
  );
}
