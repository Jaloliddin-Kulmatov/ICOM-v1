import React, { useMemo, useState } from "react";
import { Pressable, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CITIES, JOB_FIELDS, TOPIK_LEVELS } from "@/lib/options";
import { jobCategory, jobCity } from "@/lib/jobs";
import { scheduleVisaReminders } from "@/lib/notifications";
import { setItem, welcomeKey } from "@/lib/storage";
import { radius, space, useColors } from "@/lib/theme";
import { useJobs } from "@/hooks/use-jobs";
import { Button, Chip, Row, Screen, Text } from "@/components/ui";
import { DateField } from "@/components/date-field";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const GOALS: { id: string; label: string; icon: IconName }[] = [
  { id: "internship", label: "An internship", icon: "briefcase-outline" },
  { id: "part-time", label: "A part-time job", icon: "time-outline" },
  { id: "full-time", label: "A full-time job after graduation", icon: "ribbon-outline" },
  { id: "exploring", label: "Just looking around", icon: "compass-outline" },
];
const STEPS = 4;

/** First-run setup: how ICOM helps, then a few questions that tune internship matches. */
export default function Welcome() {
  const { user, refresh } = useAuth();
  const c = useColors();
  const { jobs } = useJobs();
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [field, setField] = useState(user?.job_field || "");
  const [city, setCity] = useState(user?.city || "");
  const [topik, setTopik] = useState<number | null>(user?.topik_level ?? null);
  const [expiry, setExpiry] = useState(user?.visa_expiry || "");
  const [alerts, setAlerts] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Live numbers from the current internship list, so every claim here is true today.
  const market = useMemo(() => ({
    open: jobs.length,
    english: jobs.filter((j) => j.insights?.english_ok || j.foreigner_friendly === "yes").length,
    korean: jobs.filter((j) => j.insights?.korean_required).length,
    inField: field ? jobs.filter((j) => jobCategory(j) === field).length : 0,
    inCity: city ? jobs.filter((j) => { const jc = jobCity(j); return jc === city || jc === "Remote"; }).length : 0,
  }), [jobs, field, city]);

  if (!user) return null;
  const visa = (user.visa_type || "").toUpperCase();

  const leave = async () => {
    await setItem(welcomeKey(user.id), "1");
    router.replace("/");
  };

  const finish = async () => {
    setBusy(true); setError("");
    const { error: e } = await api.patch("/auth/me", { job_field: field, city, topik_level: topik, visa_expiry: expiry });
    if (e) { setBusy(false); setError(e); return; }
    if (alerts) await api.post("/admin/jobs/alerts", { enabled: true, field, city });
    if (expiry) await scheduleVisaReminders(expiry, user.visa_type);
    await setItem(`goals_${user.id}`, JSON.stringify(goals));
    await refresh();
    setBusy(false);
    await leave();
  };

  const toggleGoal = (id: string) => setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));

  const choice = (on: boolean, onPress: () => void, icon: IconName, label: string) => (
    <Pressable key={label} onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
      style={{ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderRadius: radius.card,
        borderWidth: on ? 2 : 1, borderColor: on ? c.accent : c.rule, backgroundColor: on ? c.accentSoft : c.card }}>
      <Ionicons name={icon} size={22} color={on ? c.accent : c.muted} />
      <Text variant="heading" style={{ flex: 1 }}>{label}</Text>
      <Ionicons name={on ? "checkmark-circle" : "ellipse-outline"} size={22} color={on ? c.accent : c.rule} />
    </Pressable>
  );

  const fact = (icon: IconName, text: string) => (
    <Row style={{ alignItems: "flex-start" }} gap={space.md}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.accentSoft, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={18} color={c.accent} />
      </View>
      <Text style={{ flex: 1 }}>{text}</Text>
    </Row>
  );

  const wrap = (children: React.ReactNode) => <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>{children}</View>;

  const pages = [
    // 0 · How ICOM helps
    <>
      <Text variant="display">Welcome to ICOM, {user.name.split(" ")[0]}.</Text>
      <Text color="muted">Finding work in Korea as an international student is hard. Most job sites are in Korean and don&apos;t say who can hire foreigners. ICOM does that work for you.</Text>
      {fact("briefcase-outline", market.open
        ? `${market.open} internships open right now, checked every day. Closed ones are removed automatically.`
        : "Internships checked every day. Closed ones are removed automatically.")}
      {market.open ? fact("language-outline", `${market.english} of them say English is fine or welcome foreigners. We mark which ones need Korean.`) : null}
      {fact("shield-checkmark-outline", "Visa reminders before your visa ends, plus step-by-step guides for ARC, banking, insurance and housing.")}
      {fact("people-outline", "Ask students at your university or across Korea, and join clubs and communities.")}
    </>,
    // 1 · Goal
    <>
      <Text variant="title">What are you looking for?</Text>
      <Text color="muted">Pick all that fit.</Text>
      {GOALS.map((g) => choice(goals.includes(g.id), () => toggleGoal(g.id), g.icon, g.label))}
      {goals.includes("part-time") && visa.startsWith("D-2") ? (
        <Text variant="small" color="accent">On a D-2 visa you need a part-time work permit before you start. The Guide tab shows how to get one.</Text>
      ) : null}
    </>,
    // 2 · Field and city
    <>
      <Text variant="title">Which field and city?</Text>
      <Text color="muted">We put matching internships first on your Home screen.</Text>
      <Text variant="small" style={{ fontWeight: "600", color: c.ink }}>Field</Text>
      {wrap(JOB_FIELDS.map((v) => <Chip key={v} label={v} selected={field === v} onPress={() => setField(field === v ? "" : v)} />))}
      <Text variant="small" style={{ fontWeight: "600", color: c.ink, marginTop: space.sm }}>City</Text>
      {wrap(CITIES.map((v) => <Chip key={v} label={v} selected={city === v} onPress={() => setCity(city === v ? "" : v)} />))}
      {field || city ? (
        <Text variant="small" color="accent">
          {[field && `${market.inField} open in ${field}`, city && `${market.inCity} in ${city} or remote`].filter(Boolean).join(" · ")}
        </Text>
      ) : null}
    </>,
    // 3 · Korean, visa, alerts
    <>
      <Text variant="title">Korean and visa</Text>
      <Text color="muted">
        {market.korean ? `${market.korean} of ${market.open} open internships ask for Korean. Your level helps us show the ones you can apply to.` : "Your level helps us show internships you can apply to."}
      </Text>
      <Text variant="small" style={{ fontWeight: "600", color: c.ink }}>Korean level</Text>
      {wrap(TOPIK_LEVELS.map((l) => (
        <Chip key={l} label={l === 0 ? "No TOPIK" : `TOPIK ${l}`} selected={topik === l} onPress={() => setTopik(topik === l ? null : l)} />
      )))}
      <DateField label="When does your visa expire? (optional)" value={expiry} onChange={setExpiry} placeholder="Not set" />
      <Row style={{ justifyContent: "space-between", marginTop: space.sm }}>
        <View style={{ flex: 1, paddingRight: space.md }}>
          <Text variant="heading">Email me new internships</Text>
          <Text variant="small">One email a day at most, only when there are new matches. Turn it off any time in Profile.</Text>
        </View>
        <Switch value={alerts} onValueChange={setAlerts} trackColor={{ true: c.accent, false: c.rule }} accessibilityLabel="Email me new internships" />
      </Row>
      {error ? <Text color="coral" variant="small">{error}</Text> : null}
    </>,
  ];

  const last = step === STEPS - 1;
  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <Row style={{ paddingHorizontal: space.lg, paddingTop: space.sm, justifyContent: "space-between" }}>
        {step > 0 ? (
          <Pressable onPress={() => setStep(step - 1)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={24} color={c.ink} />
          </Pressable>
        ) : <View style={{ width: 24 }} />}
        <Row gap={6}>
          {Array.from({ length: STEPS }, (_, i) => (
            <View key={i} style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i <= step ? c.accent : c.rule }} />
          ))}
        </Row>
        <Pressable onPress={leave} hitSlop={10} accessibilityRole="button">
          <Text variant="small" style={{ fontWeight: "700" }}>Skip</Text>
        </Pressable>
      </Row>
      <Screen edges={[]}>{pages[step]}</Screen>
      <View style={{ padding: space.lg, paddingTop: space.sm }}>
        <Button title={last ? "Start using ICOM" : step === 0 ? "Get started" : "Next"} loading={busy}
          onPress={last ? finish : () => setStep(step + 1)} />
      </View>
    </SafeAreaView>
  );
}
