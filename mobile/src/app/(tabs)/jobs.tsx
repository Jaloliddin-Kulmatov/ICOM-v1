import React, { useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/lib/auth";
import { JOB_FIELDS } from "@/lib/options";
import { jobCategory, matchScore, matchesSearch } from "@/lib/jobs";
import { space, useColors } from "@/lib/theme";
import { useJobs } from "@/hooks/use-jobs";
import { Button, Card, Chip, ChipRow, Empty, ErrorBox, Input, Loading, Row, Segmented, Text } from "@/components/ui";
import { Ionicons } from "@expo/vector-icons";
import { JobCard } from "@/components/job-card";

type Sort = "match" | "newest";
type Kind = "internship" | "part-time";

export default function Jobs() {
  const { user } = useAuth();
  const c = useColors();
  const { jobs, loading, refreshing, error, reload, pull } = useJobs();
  const [q, setQ] = useState("");
  const [field, setField] = useState("All");
  const [welcome, setWelcome] = useState(false);
  const [sort, setSort] = useState<Sort>("match");
  // Home's "See all part-time jobs" opens this tab with ?kind=part-time.
  const params = useLocalSearchParams<{ kind?: string }>();
  const [picked, setKind] = useState<Kind | null>(null);
  const kind: Kind = picked ?? (params.kind === "part-time" ? "part-time" : "internship");
  const partTime = kind === "part-time";
  const ofKind = useMemo(() => jobs.filter((j) => (j.type === "part-time") === partTime), [jobs, partTime]);
  const noun = (n: number) => (partTime ? `part-time job${n === 1 ? "" : "s"}` : `internship${n === 1 ? "" : "s"}`);

  const list = useMemo(() => {
    const rows = ofKind
      .filter((j) => (field === "All" || jobCategory(j) === field) && (!welcome || j.foreigner_friendly === "yes") && matchesSearch(j, q))
      .map((j) => ({ j, m: matchScore(j, user) }));
    if (sort === "match") rows.sort((a, b) => b.m.score - a.m.score || b.j.created_at.localeCompare(a.j.created_at));
    else rows.sort((a, b) => b.j.created_at.localeCompare(a.j.created_at));
    return rows;
  }, [ofKind, field, welcome, q, sort, user]);

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        data={list}
        keyExtractor={(r) => String(r.j.id)}
        contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xxl }}
        refreshing={refreshing}
        onRefresh={pull}
        initialNumToRender={8}
        ListHeaderComponent={
          <View style={{ gap: space.sm, marginBottom: space.sm }}>
            <Segmented<Kind> value={kind} onChange={(k) => { setKind(k); setField("All"); }} options={[
              { value: "internship", label: "Internships", icon: "briefcase-outline" },
              { value: "part-time", label: "Part-time", icon: "time-outline" },
            ]} />
            {partTime && (
              <Card style={{ backgroundColor: c.accentSoft, borderColor: c.accentSoft }}>
                <Row style={{ alignItems: "flex-start" }}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={c.accent} />
                  <Text variant="small" color="ink" style={{ flex: 1 }}>
                    On a D-2 or D-4 visa you need a part-time work permit (시간제취업허가) before you start.
                  </Text>
                </Row>
                <Row>
                  <Button title="How to get it" variant="ghost" onPress={() => router.push("/guide/visa")} style={{ flex: 1 }} />
                  <Button title="Share a job" icon="add-circle-outline" onPress={() => router.push("/share-job")} style={{ flex: 1 }} />
                </Row>
              </Card>
            )}
            <Input value={q} onChangeText={setQ} placeholder="Search role, company or city" returnKeyType="search" accessibilityLabel={`Search ${noun(2)}`} />
            <ChipRow>
              <Chip label="Best match" selected={sort === "match"} onPress={() => setSort("match")} icon="sparkles-outline" />
              <Chip label="Newest" selected={sort === "newest"} onPress={() => setSort("newest")} />
              <Chip label="Foreigners welcome" selected={welcome} onPress={() => setWelcome(!welcome)} icon="globe-outline" />
            </ChipRow>
            {!partTime && (   // office fields don't describe café or shop work
              <ChipRow>
                {["All", ...JOB_FIELDS].map((f) => <Chip key={f} label={f} selected={field === f} onPress={() => setField(f)} />)}
              </ChipRow>
            )}
            {!loading && <Text variant="small">{list.length} {noun(list.length)}</Text>}
            {error ? <ErrorBox message={error} onRetry={reload} /> : null}
          </View>
        }
        ListEmptyComponent={loading ? <Loading /> : partTime && ofKind.length === 0 ? (
          <Empty icon="time-outline" title="No part-time jobs yet"
            body="Know a café, shop or restaurant that hires international students? Share it and help others."
            action={<Button title="Share a part-time job" icon="add-circle-outline" onPress={() => router.push("/share-job")} />} />
        ) : (
          <Empty icon="briefcase-outline" title={`No ${noun(2)} match`} body="Try another field or clear the search." />
        )}
        renderItem={({ item }) => <JobCard job={item.j} match={sort === "match" ? item.m.reasons : undefined} />}
      />
    </SafeAreaView>
  );
}
