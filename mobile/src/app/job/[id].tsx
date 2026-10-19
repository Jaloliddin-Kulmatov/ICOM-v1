import React, { useEffect, useState } from "react";
import { Share, View } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { api } from "@/lib/api";
import { WEB_URL } from "@/lib/config";
import { daysLeft } from "@/lib/jobs";
import { space, useColors } from "@/lib/theme";
import type { Job } from "@/lib/types";
import { Button, Card, Chip, Empty, Loading, Row, Screen, Text } from "@/components/ui";

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
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
        <Empty icon="briefcase-outline" title="Not available" body={error}
          action={<Button title="Back to internships" variant="secondary" onPress={() => router.back()} />} />
      </Screen>
    );
  }
  if (!job) return <Screen><Loading /></Screen>;
  const d = daysLeft(job);

  const apply = async () => {
    api.post(`/admin/jobs/${job.id}/apply-click`);
    if (job.apply_link) await WebBrowser.openBrowserAsync(job.apply_link);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: job.company }} />
      <Text variant="title">{job.title}</Text>
      <Text color="muted">{job.company} · {job.location || "Korea"}</Text>
      <Row style={{ flexWrap: "wrap" }} gap={6}>
        {job.foreigner_friendly === "yes" && <Chip label="Foreigners welcome" tone="good" icon="globe-outline" />}
        {d === null ? <Chip label="Rolling deadline" /> : <Chip label={`Deadline ${job.deadline} (${Math.max(d, 0)} days)`} tone={d <= 7 ? "urgent" : "muted"} />}
        {job.salary ? <Chip label={job.salary} /> : null}
      </Row>

      {job.insights && (job.insights.student_role || job.insights.korean_required || job.insights.visa_support) && (
        <Card style={{ backgroundColor: c.accentSoft, borderColor: c.accentSoft }}>
          <Text variant="heading">Before you apply</Text>
          {job.insights.student_role && <Text variant="small" color="ink">• On a D-2 or D-4 visa you need a part-time work permit (시간제취업허가) before you start.</Text>}
          {job.insights.korean_required && <Text variant="small" color="ink">• The posting asks for strong Korean (for example business level or TOPIK 4+).</Text>}
          {job.insights.visa_support && <Text variant="small" color="ink">• The posting mentions visa sponsorship or E-7 support. Confirm with the company.</Text>}
          <Text variant="small">Read from the posting&apos;s text, so check with the company.</Text>
        </Card>
      )}

      <Card>
        <Text variant="heading">About the role</Text>
        <Text>{job.description}</Text>
      </Card>
      {job.requirements.length > 0 && (
        <Card>
          <Text variant="heading">Requirements</Text>
          {job.requirements.map((r, i) => <Text key={i} variant="small" color="ink">• {r}</Text>)}
        </Card>
      )}
      {job.foreigner_note ? <Text variant="small">{job.foreigner_note}</Text> : null}

      <View style={{ gap: space.sm, marginTop: space.sm }}>
        <Button title="Apply on the company site" icon="open-outline" onPress={apply} disabled={!job.apply_link} />
        <Button title="Share" variant="secondary" icon="share-outline"
          onPress={() => Share.share({ message: `${job.title} at ${job.company}: ${WEB_URL}/internships/${job.id}` })} />
      </View>
    </Screen>
  );
}
