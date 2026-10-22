import React, { useMemo } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { ARRIVAL_STEPS, daysUntil } from "@/lib/options";
import { matchScore } from "@/lib/jobs";
import { space, useColors } from "@/lib/theme";
import type { ClubEvent } from "@/lib/types";
import { useJobs } from "@/hooks/use-jobs";
import { useWelcomeGoals } from "@/lib/welcome";
import { useApi } from "@/hooks/use-api";
import { Button, Card, Icon, Row, Screen, Text } from "@/components/ui";
import { JobCard } from "@/components/job-card";
import { useT } from "@/i18n";

export default function Home() {
  const { user, refresh } = useAuth();
  const c = useColors();
  const { t, tn } = useT();
  const { internships: jobs, partTime, pull, refreshing } = useJobs();
  const goals = useWelcomeGoals();
  const ev = useApi<{ events: ClubEvent[] }>("/clubs/events/upcoming");
  const events = ev.data?.events || [];

  const top = useMemo(() => jobs
    .map((j) => ({ j, m: matchScore(j, user) }))
    .sort((a, b) => b.m.score - a.m.score)
    .slice(0, 3), [jobs, user]);

  if (!user) return null;
  const days = daysUntil(user.visa_expiry);
  const done = (user.checklist || []).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("Good morning, {name}.", { name: user.name.split(" ")[0] })
    : hour < 18 ? t("Good afternoon, {name}.", { name: user.name.split(" ")[0] }) : t("Good evening, {name}.", { name: user.name.split(" ")[0] });

  // The welcome's "what are you looking for" decides which jobs Home shows.
  const wantsPartTime = goals.includes("part-time");

  const partTimeSection = (
    <View style={{ gap: space.sm }}>
      <Text variant="label" style={{ marginTop: space.sm }}>{t("Part-time jobs")}</Text>
      {partTime.slice(0, 3).map((j) => <JobCard key={j.id} job={j} />)}
      {partTime.length === 0 && (
        <Card>
          <Text variant="small">{t("No part-time jobs yet. Know a place that hires international students? Share it.")}</Text>
          <Button title={t("Share a part-time job")} variant="secondary" icon="add-circle-outline" onPress={() => router.push("/share-job")} />
        </Card>
      )}
      {partTime.length > 0 && <Button title={t("See all part-time jobs")} variant="ghost" onPress={() => router.push("/jobs?kind=part-time")} />}
    </View>
  );

  const internshipSection = (
    <View style={{ gap: space.sm }}>
      <Text variant="label" style={{ marginTop: space.sm }}>{user.job_field || user.city ? t("Internships for you") : t("Latest internships")}</Text>
      {top.map(({ j, m }) => <JobCard key={j.id} job={j} match={m.reasons} />)}
      {!user.job_field && !user.city && (
        <Button title={t("Set your field and city for better matches")} variant="secondary" icon="options-outline" onPress={() => router.push("/profile")} />
      )}
      <Button title={t("See all internships")} variant="ghost" onPress={() => router.push("/jobs")} />
    </View>
  );

  return (
    <Screen refreshing={refreshing} onRefresh={() => { pull(); refresh(); ev.reload(); }}>
      <Text variant="display">{greeting}</Text>
      <Text color="muted">{[user.visa_type, user.university?.toUpperCase()].filter(Boolean).join(" · ")}</Text>

      <Card onPress={() => router.push(days == null ? "/profile" : "/guide/visa")}>
        <Row><Icon name="shield-checkmark-outline" /><Text variant="heading">{t("Visa")}</Text></Row>
        {days == null ? (
          <Text color="muted">{t("Add your visa expiry date to get reminders 90, 60, 30 and 7 days before it ends.")}</Text>
        ) : (
          <>
            <Text variant="display" style={{ color: days < 0 ? c.coral : days <= 60 ? c.coral : c.ink }}>
              {days < 0 ? t("Expired") : tn("days", days)}
            </Text>
            <Text variant="small">{t("{visa} expires on {date}. Apply to extend it at least 4 weeks before.", { visa: user.visa_type || t("Visa"), date: user.visa_expiry || "" })}</Text>
          </>
        )}
      </Card>

      {done < ARRIVAL_STEPS.length && (
        <Card onPress={() => router.push("/guide")}>
          <Row><Icon name="checkmark-done-outline" /><Text variant="heading">{t("Arrival checklist")}</Text></Row>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: c.rule, overflow: "hidden" }}>
            <View style={{ width: `${(done / ARRIVAL_STEPS.length) * 100}%`, height: 6, backgroundColor: c.line }} />
          </View>
          <Text variant="small">{t("{done} of {total} done. Next: {step}", { done, total: ARRIVAL_STEPS.length, step: t(ARRIVAL_STEPS.find((s) => !(user.checklist || []).includes(s.id))?.title || "") })}</Text>
        </Card>
      )}

      {events.length > 0 && (
        <View style={{ gap: space.sm }}>
          <Text variant="label">{t("Coming up in your clubs")}</Text>
          {events.slice(0, 3).map((e) => (
            <Card key={e.id} onPress={() => router.push(`/club/${e.club_id}`)}>
              <Text variant="heading">{e.title}</Text>
              <Text variant="small">{e.starts_at.replace("T", " · ")} ({t("Korea time")}) · {e.club_name}</Text>
            </Card>
          ))}
        </View>
      )}

      {wantsPartTime && partTimeSection}
      {internshipSection}
    </Screen>
  );
}
