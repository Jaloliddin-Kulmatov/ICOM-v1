import React, { useEffect, useState } from "react";
import { Linking, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import type { Job } from "@/lib/types";
import { Badge, Button, Card, EmptyState, LoadingScreen } from "@/components/ui";

export default function InternshipDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get<{ job: Job }>(`/admin/jobs/${id}`).then(({ data, error: err }) => {
      if (cancelled) return;
      if (data?.job) setJob(data.job);
      else setError(err || "Internship not found.");
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const apply = () => {
    if (!job?.apply_link) return;
    // Fire-and-forget click counter (same as the web app) — never blocks the link.
    api.post(`/admin/jobs/${job.id}/apply-click`);
    Linking.openURL(job.apply_link);
  };

  if (error) return <EmptyState title="Couldn't load internship" subtitle={error} />;
  if (!job) return <LoadingScreen />;

  return (
    <>
      <Stack.Screen options={{ title: job.company }} />
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-12">
        <Text className="text-white text-2xl font-bold">{job.title}</Text>
        <Text className="text-icon-300 text-base mt-1">{job.company}</Text>

        <View className="flex-row flex-wrap mt-4">
          {job.location ? <Badge label={job.location} tone="gray" /> : null}
          {job.type ? <Badge label={job.type} tone="indigo" /> : null}
          {job.salary ? <Badge label={job.salary} tone="amber" /> : null}
          {job.foreigner_friendly === "yes" && <Badge label="Foreigner friendly" tone="green" />}
          {job.isNew && <Badge label="NEW" tone="green" />}
        </View>

        <Card className="mt-4">
          <Text className="text-muted text-xs uppercase mb-1">Deadline</Text>
          <Text className="text-white font-medium">
            {job.deadline || "Rolling — apply anytime"}
          </Text>
          {job.visa_compatible.length > 0 && (
            <>
              <Text className="text-muted text-xs uppercase mt-3 mb-1">Visa</Text>
              <Text className="text-white font-medium">{job.visa_compatible.join(", ")}</Text>
            </>
          )}
          {job.foreigner_note ? (
            <>
              <Text className="text-muted text-xs uppercase mt-3 mb-1">Note for foreigners</Text>
              <Text className="text-white">{job.foreigner_note}</Text>
            </>
          ) : null}
        </Card>

        {job.description ? (
          <>
            <Text className="text-white text-lg font-bold mt-6 mb-2">About this role</Text>
            <Text className="text-[#c9c9dc] leading-6">{job.description}</Text>
          </>
        ) : null}

        {job.requirements.length > 0 && (
          <>
            <Text className="text-white text-lg font-bold mt-6 mb-2">Requirements</Text>
            {job.requirements.map((r, i) => (
              <View key={i} className="flex-row mb-1.5">
                <Text className="text-icon-400 mr-2">•</Text>
                <Text className="text-[#c9c9dc] flex-1 leading-6">{r}</Text>
              </View>
            ))}
          </>
        )}

        {job.tags.length > 0 && (
          <View className="flex-row flex-wrap mt-4">
            {job.tags.map((t) => (
              <Badge key={t} label={t} tone="gray" />
            ))}
          </View>
        )}

        <Text className="text-muted text-xs mt-4">
          Posted {timeAgo(job.created_at)}
          {job.apply_count > 0 ? ` · ${job.apply_count} students applied` : ""}
        </Text>

        {job.apply_link ? (
          <Button title="Apply Now ↗" onPress={apply} className="mt-6" />
        ) : (
          <Text className="text-muted text-sm mt-6 text-center">
            No application link available for this posting.
          </Text>
        )}
      </ScrollView>
    </>
  );
}
