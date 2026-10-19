import React from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Card, Chip, Row, Text } from "./ui";
import { daysLeft, jobCategory, jobCity } from "@/lib/jobs";
import type { Job } from "@/lib/types";

export function JobCard({ job, match }: { job: Job; match?: string[] }) {
  const d = daysLeft(job);
  const field = jobCategory(job);
  const city = jobCity(job);
  return (
    <Card onPress={() => router.push(`/job/${job.id}`)} accessibilityLabel={`${job.title} at ${job.company}`}>
      <Text variant="heading" numberOfLines={2}>{job.title}</Text>
      <Text variant="small" numberOfLines={1}>{job.company}{city !== "Other" ? ` · ${city}` : ""}</Text>
      <Row style={{ flexWrap: "wrap", marginTop: 4 }} gap={6}>
        {match && match.length > 0 && <Chip label={`Matches you: ${match.join(" · ")}`} tone="good" icon="sparkles-outline" />}
        {job.foreigner_friendly === "yes" && <Chip label="Foreigners welcome" tone="good" icon="globe-outline" />}
        {job.insights?.korean_required && job.foreigner_friendly !== "no" && <Chip label="Korean needed" tone="urgent" icon="language-outline" />}
        {job.insights?.visa_support && <Chip label="Visa support mentioned" tone="teal" icon="shield-checkmark-outline" />}
        {d === null ? <Chip label="Rolling" /> : <Chip label={d <= 0 ? "Closes today" : `${d} days left`} tone={d <= 7 ? "urgent" : "muted"} />}
        {field !== "Other" && <Chip label={field} />}
      </Row>
      <View />
    </Card>
  );
}
