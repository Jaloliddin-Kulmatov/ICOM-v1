import React, { useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { JOB_FIELDS } from "@/lib/options";
import { jobCategory, matchScore, matchesSearch } from "@/lib/jobs";
import { space, useColors } from "@/lib/theme";
import { useJobs } from "@/hooks/use-jobs";
import { Chip, ChipRow, Empty, ErrorBox, Input, Loading, Text } from "@/components/ui";
import { JobCard } from "@/components/job-card";

type Sort = "match" | "newest";

export default function Jobs() {
  const { user } = useAuth();
  const c = useColors();
  const { jobs, loading, refreshing, error, reload, pull } = useJobs();
  const [q, setQ] = useState("");
  const [field, setField] = useState("All");
  const [welcome, setWelcome] = useState(false);
  const [sort, setSort] = useState<Sort>("match");

  const list = useMemo(() => {
    const rows = jobs
      .filter((j) => (field === "All" || jobCategory(j) === field) && (!welcome || j.foreigner_friendly === "yes") && matchesSearch(j, q))
      .map((j) => ({ j, m: matchScore(j, user) }));
    if (sort === "match") rows.sort((a, b) => b.m.score - a.m.score || b.j.created_at.localeCompare(a.j.created_at));
    else rows.sort((a, b) => b.j.created_at.localeCompare(a.j.created_at));
    return rows;
  }, [jobs, field, welcome, q, sort, user]);

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
            <Input value={q} onChangeText={setQ} placeholder="Search role, company or city" returnKeyType="search" accessibilityLabel="Search internships" />
            <ChipRow>
              <Chip label="Best match" selected={sort === "match"} onPress={() => setSort("match")} icon="sparkles-outline" />
              <Chip label="Newest" selected={sort === "newest"} onPress={() => setSort("newest")} />
              <Chip label="Foreigners welcome" selected={welcome} onPress={() => setWelcome(!welcome)} icon="globe-outline" />
            </ChipRow>
            <ChipRow>
              {["All", ...JOB_FIELDS].map((f) => <Chip key={f} label={f} selected={field === f} onPress={() => setField(f)} />)}
            </ChipRow>
            {!loading && <Text variant="small">{list.length} internship{list.length === 1 ? "" : "s"}</Text>}
            {error ? <ErrorBox message={error} onRetry={reload} /> : null}
          </View>
        }
        ListEmptyComponent={loading ? <Loading /> : <Empty icon="briefcase-outline" title="No internships match" body="Try another field or clear the search." />}
        renderItem={({ item }) => <JobCard job={item.j} match={sort === "match" ? item.m.reasons : undefined} />}
      />
    </SafeAreaView>
  );
}
