import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import type { Job } from "@/lib/types";
import { Badge, Card, EmptyState, LoadingScreen } from "@/components/ui";

// Field filter buckets mirror the web Internships page: match on tags/title.
const FIELDS = ["All", "IT", "Design", "Marketing", "Business", "Engineering"];

function matchesField(job: Job, field: string): boolean {
  if (field === "All") return true;
  const hay = `${job.title} ${job.tags.join(" ")}`.toLowerCase();
  const keywords: Record<string, string[]> = {
    IT: ["developer", "software", "engineer", "it", "data", "frontend", "backend", "ai"],
    Design: ["design", "ux", "ui", "graphic", "brand"],
    Marketing: ["marketing", "content", "sns", "social", "growth"],
    Business: ["business", "sales", "finance", "hr", "operations", "management"],
    Engineering: ["mechanical", "electrical", "chemical", "hardware", "manufacturing"],
  };
  return (keywords[field] || []).some((k) => hay.includes(k));
}

export default function InternshipsScreen() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [field, setField] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    const [jobsRes, alertsRes] = await Promise.all([
      api.get<{ jobs: Job[] }>("/admin/jobs"),
      api.get<{ enabled: boolean }>("/admin/jobs/alerts"),
    ]);
    if (jobsRes.data) {
      setJobs(jobsRes.data.jobs);
      setError(null);
    } else {
      setError(jobsRes.error);
      setJobs((prev) => prev ?? []);
    }
    if (alertsRes.data) setAlertsEnabled(alertsRes.data.enabled);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const toggleAlerts = async (value: boolean) => {
    setAlertsEnabled(value); // optimistic
    const { data, error: err } = await api.post<{ enabled: boolean }>("/admin/jobs/alerts", {
      enabled: value,
      field,
    });
    if (err) setAlertsEnabled(!value);
    else if (data) setAlertsEnabled(data.enabled);
  };

  const visible = useMemo(() => {
    if (!jobs) return [];
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      if (!matchesField(j, field)) return false;
      if (!q) return true;
      return `${j.title} ${j.company} ${j.location} ${j.tags.join(" ")}`
        .toLowerCase()
        .includes(q);
    });
  }, [jobs, search, field]);

  if (jobs === null) return <LoadingScreen message="Loading internships…" />;

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-3 pb-1">
        <View className="flex-row items-center bg-card border border-border rounded-xl px-3">
          <Ionicons name="search" size={18} color="#8b8ba3" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search title, company, city…"
            placeholderTextColor="#5c5c73"
            className="flex-1 px-2 py-3 text-white"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerClassName="pr-4"
        >
          {FIELDS.map((f) => {
            const active = field === f;
            return (
              <Pressable
                key={f}
                onPress={() => setField(f)}
                className={`rounded-full px-4 py-2 mr-2 border ${
                  active ? "bg-icon-500 border-icon-500" : "bg-card border-border"
                }`}
              >
                <Text className={active ? "text-white font-semibold" : "text-muted"}>{f}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {alertsEnabled !== null && (
          <View className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-2.5 mt-3">
            <View className="flex-row items-center">
              <Ionicons name="notifications" size={16} color="#7c7cff" />
              <Text className="text-white ml-2 text-sm font-medium">
                Email me about new internships
              </Text>
            </View>
            <Switch
              value={alertsEnabled}
              onValueChange={toggleAlerts}
              trackColor={{ false: "#26263a", true: "#4f46e5" }}
              thumbColor="#ffffff"
            />
          </View>
        )}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(j) => String(j.id)}
        contentContainerClassName="p-4 pb-10"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
        ListEmptyComponent={
          <EmptyState
            title={error ? "Couldn't load internships" : "No internships found"}
            subtitle={error || "Try a different search or field filter."}
          />
        }
        renderItem={({ item: job }) => (
          <Pressable onPress={() => router.push(`/internships/${job.id}`)}>
            <Card className="mb-3 active:border-icon-500">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                  <Text className="text-white font-semibold text-base" numberOfLines={2}>
                    {job.title}
                  </Text>
                  <Text className="text-muted text-sm mt-0.5">{job.company}</Text>
                </View>
                {job.isNew && <Badge label="NEW" tone="green" />}
              </View>

              <View className="flex-row flex-wrap mt-3">
                {job.location ? <Badge label={job.location} tone="gray" /> : null}
                {job.type ? <Badge label={job.type} tone="indigo" /> : null}
                {job.foreigner_friendly === "yes" && (
                  <Badge label="Foreigner friendly" tone="green" />
                )}
              </View>

              <View className="flex-row items-center justify-between mt-2">
                <Text className="text-muted text-xs">
                  {job.deadline ? `Deadline: ${job.deadline}` : "Rolling deadline"}
                </Text>
                <Text className="text-muted text-xs">
                  {job.apply_count > 0 ? `${job.apply_count} applied · ` : ""}
                  {timeAgo(job.created_at)}
                </Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}
