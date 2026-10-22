import React from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Card, Chip, Row, Text } from "./ui";
import { daysLeft, jobCategory, jobCity } from "@/lib/jobs";
import type { Job } from "@/lib/types";
import { useT } from "@/i18n";

export function JobCard({ job, match }: { job: Job; match?: string[] }) {
  const d = daysLeft(job);
  const field = jobCategory(job);
  const city = jobCity(job);
  const { t, tn } = useT();
  return (
    <Card onPress={() => router.push(`/job/${job.id}`)} accessibilityLabel={t("{title} at {company}", { title: job.title, company: job.company })}>
      <Text variant="heading" numberOfLines={2}>{job.title}</Text>
      <Text variant="small" numberOfLines={1}>{job.company}{city !== "Other" ? ` · ${city}` : ""}</Text>
      <Row style={{ flexWrap: "wrap", marginTop: 4 }} gap={6}>
        {match && match.length > 0 && <Chip label={t("Matches you: {reasons}", { reasons: match.map((r) => t(r)).join(" · ") })} tone="good" icon="sparkles-outline" />}
        {job.foreigner_friendly === "yes" && <Chip label={t("Foreigners welcome")} tone="good" icon="globe-outline" />}
        {job.insights?.korean_required && job.foreigner_friendly !== "no" && <Chip label={t("Korean needed")} tone="urgent" icon="language-outline" />}
        {job.insights?.visa_support && <Chip label={t("Visa support mentioned")} tone="teal" icon="shield-checkmark-outline" />}
        {d === null ? <Chip label={t("Rolling")} /> : <Chip label={d <= 0 ? t("Closes today") : tn("days left", d)} tone={d <= 7 ? "urgent" : "muted"} />}
        {job.type === "part-time" ? <Chip label={t("Part-time")} tone="teal" icon="time-outline" /> : field !== "Other" && <Chip label={t(field)} />}
      </Row>
      <View />
    </Card>
  );
}
