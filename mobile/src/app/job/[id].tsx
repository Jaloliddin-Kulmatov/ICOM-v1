import React, { useEffect, useState } from "react";
import { Share, View } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { WEB_URL } from "@/lib/config";
import { daysLeft } from "@/lib/jobs";
import { space, useColors } from "@/lib/theme";
import type { Job } from "@/lib/types";
import { Button, Card, Chip, Empty, Loading, Row, Screen, Text } from "@/components/ui";
import { useT } from "@/i18n";

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const visa = (user?.visa_type || "").toUpperCase();
  const needsPermit = !visa || visa.startsWith("D-2") || visa.startsWith("D-4");
  const c = useColors();
  const { t, tn } = useT();
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ job: Job }>(`/admin/jobs/${id}`).then(({ data, error: e }) => {
      if (data) setJob(data.job); else setError(e || "This internship has closed.");
    });
  }, [id]);

  if (error) {
    return (
      <Screen>
        <Empty icon="briefcase-outline" title={t("Not available")} body={error}
          action={<Button title={t("Back")} variant="secondary" onPress={() => router.back()} />} />
      </Screen>
    );
  }
  if (!job) return <Screen><Loading /></Screen>;
  const d = daysLeft(job);

  const apply = async () => {
    api.post(`/admin/jobs/${job.id}/apply-click`);
    if (job.apply_link) await WebBrowser.openBrowserAsync(job.apply_link);
  };

  const isPartTime = job.type === "part-time";
  const permitNote = needsPermit && (isPartTime || !!job.insights?.student_role);

  return (
    <Screen>
      <Stack.Screen options={{ title: job.company }} />
      <Text variant="title">{job.title}</Text>
      <Text color="muted">{job.company} · {job.location || t("Korea")}</Text>
      <Row style={{ flexWrap: "wrap" }} gap={6}>
        {job.foreigner_friendly === "yes" && <Chip label={t("Foreigners welcome")} tone="good" icon="globe-outline" />}
        {d === null ? <Chip label={t("Rolling deadline")} /> : <Chip label={t("Deadline {date} ({days})", { date: job.deadline, days: tn("days", Math.max(d, 0)) })} tone={d <= 7 ? "urgent" : "muted"} />}
        {job.salary ? <Chip label={job.salary} /> : null}
      </Row>

      {(isPartTime || permitNote || job.insights?.korean_required || job.insights?.visa_support) && (
        <Card style={{ backgroundColor: c.accentSoft, borderColor: c.accentSoft }}>
          <Text variant="heading">{t("Before you apply")}</Text>
          {permitNote && (
            <Text variant="small" color="ink">• {visa ? t("On a {visa} visa you need a part-time work permit (시간제취업허가) before you start.", { visa }) : t("On a D-2 or D-4 visa you need a part-time work permit (시간제취업허가) before you start.")}</Text>
          )}
          {job.insights?.korean_required && <Text variant="small" color="ink">• {t("The posting asks for strong Korean (for example business level or TOPIK 4+).")}</Text>}
          {job.insights?.visa_support && <Text variant="small" color="ink">• {t("The posting mentions visa sponsorship or E-7 support. Confirm with the company.")}</Text>}
          <Text variant="small">{isPartTime ? t("Shared by a student and checked by the ICOM team. Confirm details with the employer.") : t("Read from the posting's text, so check with the company.")}</Text>
        </Card>
      )}

      <Card>
        <Text variant="heading">{t("About the role")}</Text>
        <Text>{job.description}</Text>
      </Card>
      {job.requirements.length > 0 && (
        <Card>
          <Text variant="heading">{t("Requirements")}</Text>
          {job.requirements.map((r, i) => <Text key={i} variant="small" color="ink">• {r}</Text>)}
        </Card>
      )}
      {job.foreigner_note ? <Text variant="small">{job.foreigner_note}</Text> : null}

      <View style={{ gap: space.sm, marginTop: space.sm }}>
        <Button icon="open-outline" onPress={apply} disabled={!job.apply_link}
          title={isPartTime ? (job.apply_link ? t("Apply") : t("How to apply is in the details above")) : t("Apply on the company site")} />
        <Button title={t("Share")} variant="secondary" icon="share-outline"
          onPress={() => Share.share({ message: `${t("{title} at {company}", { title: job.title, company: job.company })}: ${WEB_URL}/internships/${job.id}` })} />
      </View>
    </Screen>
  );
}
