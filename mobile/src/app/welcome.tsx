import React, { useEffect, useMemo, useState } from "react";
import { Animated, Easing, Pressable, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CITIES, JOB_FIELDS, TOPIK_LEVELS, VISAS } from "@/lib/options";
import { jobCategory, jobCity } from "@/lib/jobs";
import { setItem, welcomeKey } from "@/lib/storage";
import { radius, space, useColors } from "@/lib/theme";
import { useJobs } from "@/hooks/use-jobs";
import { Button, Chip, Row, Screen, Text } from "@/components/ui";
import { Logo } from "@/components/logo";
import { Pop, Rise, SlideIn, useReduceMotion } from "@/components/motion";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const GOALS: { id: string; label: string; icon: IconName }[] = [
  { id: "internship", label: "An internship", icon: "briefcase-outline" },
  { id: "part-time", label: "A part-time job", icon: "time-outline" },
  { id: "full-time", label: "A full-time job after graduation", icon: "ribbon-outline" },
  { id: "exploring", label: "Just looking around", icon: "compass-outline" },
];
const STEPS = 4;

function visaNote(visa: string): string {
  if (visa === "D-2" || visa === "D-4") return "You need a part-time work permit before any part-time job or internship. The Guide tab shows how to get one.";
  if (visa === "D-10") return "We show internships that offer visa support first.";
  return "";
}

/** Progress dot that stretches when it becomes the current step. */
function Dot({ active, done }: { active: boolean; done: boolean }) {
  const c = useColors();
  const reduce = useReduceMotion();
  const [w] = useState(() => new Animated.Value(active ? 22 : 8));
  useEffect(() => {
    const to = active ? 22 : 8;
    if (reduce) { w.setValue(to); return; }
    Animated.timing(w, { toValue: to, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [active, reduce, w]);
  return <Animated.View style={{ width: w, height: 8, borderRadius: 4, backgroundColor: active || done ? c.accent : c.rule }} />;
}

/** First-run setup: how ICOM helps, then a few questions that tune internship matches. */
export default function Welcome() {
  const { user, refresh } = useAuth();
  const c = useColors();
  const { jobs } = useJobs();
  const [nav, setNav] = useState<{ step: number; dir: 1 | -1 }>({ step: 0, dir: 1 });
  const step = nav.step;
  const [goals, setGoals] = useState<string[]>([]);
  const [field, setField] = useState(user?.job_field || "");
  const [city, setCity] = useState(user?.city || "");
  const [topik, setTopik] = useState<number | null>(user?.topik_level ?? null);
  const [visa, setVisa] = useState(user?.visa_type || "");
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
  const go = (to: number) => setNav({ step: to, dir: to > step ? 1 : -1 });

  const leave = async () => {
    await setItem(welcomeKey(user.id), "1");
    router.replace("/");
  };

  const finish = async () => {
    setBusy(true); setError("");
    const { error: e } = await api.patch("/auth/me", { job_field: field, city, topik_level: topik, ...(visa ? { visa_type: visa } : {}) });
    if (e) { setBusy(false); setError(e); return; }
    if (alerts) await api.post("/admin/jobs/alerts", { enabled: true, field, city });
    await setItem(`goals_${user.id}`, JSON.stringify(goals));
    await refresh();
    setBusy(false);
    await leave();
  };

  const toggleGoal = (id: string) => setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));

  const choice = (on: boolean, onPress: () => void, icon: IconName, label: string) => (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderRadius: radius.card,
        borderWidth: on ? 2 : 1, borderColor: on ? c.accent : c.rule, backgroundColor: on ? c.accentSoft : c.card,
        transform: [{ scale: pressed ? 0.98 : 1 }] })}>
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
  const label = (text: string) => <Text variant="small" style={{ fontWeight: "600", color: c.ink }}>{text}</Text>;

  // Each page's parts rise in one after another (order = position in the stagger).
  const pages = [
    // 0 · How ICOM helps
    [
      <Pop key="logo" style={{ alignSelf: "flex-start" }}><Logo size={64} /></Pop>,
      <Text key="t" variant="display">Welcome to ICOM, {user.name.split(" ")[0]}.</Text>,
      <Text key="s" color="muted">Finding work in Korea as an international student is hard. Most job sites are in Korean and don&apos;t say who can hire foreigners. ICOM does that work for you.</Text>,
      fact("briefcase-outline", market.open
        ? `${market.open} internships open right now, checked every day. Closed ones are removed automatically.`
        : "Internships checked every day. Closed ones are removed automatically."),
      market.open ? fact("language-outline", `${market.english} of them say English is fine or welcome foreigners. We mark which ones need Korean.`) : null,
      fact("shield-checkmark-outline", "Visa reminders before your visa ends, plus step-by-step guides for ARC, banking, insurance and housing."),
      fact("people-outline", "Ask students at your university or across Korea, and join clubs and communities."),
    ],
    // 1 · Goal
    [
      <Text key="t" variant="title">What are you looking for?</Text>,
      <Text key="s" color="muted">Pick all that fit.</Text>,
      ...GOALS.map((g) => <React.Fragment key={g.id}>{choice(goals.includes(g.id), () => toggleGoal(g.id), g.icon, g.label)}</React.Fragment>),
    ],
    // 2 · Field and city
    [
      <Text key="t" variant="title">Which field and city?</Text>,
      <Text key="s" color="muted">We put matching internships first on your Home screen.</Text>,
      <View key="f" style={{ gap: space.sm }}>
        {label("Field")}
        {wrap(JOB_FIELDS.map((v) => <Chip key={v} label={v} selected={field === v} onPress={() => setField(field === v ? "" : v)} />))}
      </View>,
      <View key="c" style={{ gap: space.sm }}>
        {label("City")}
        {wrap(CITIES.map((v) => <Chip key={v} label={v} selected={city === v} onPress={() => setCity(city === v ? "" : v)} />))}
      </View>,
      field || city ? (
        <Text key="n" variant="small" color="accent">
          {[field && `${market.inField} open in ${field}`, city && `${market.inCity} in ${city} or remote`].filter(Boolean).join(" · ")}
        </Text>
      ) : null,
    ],
    // 3 · Korean, visa type, alerts
    [
      <Text key="t" variant="title">Korean and visa</Text>,
      <Text key="s" color="muted">
        {market.korean ? `${market.korean} of ${market.open} open internships ask for Korean. Your level and visa help us show the ones you can apply to.` : "Your Korean level and visa help us show internships you can apply to."}
      </Text>,
      <View key="k" style={{ gap: space.sm }}>
        {label("Korean level")}
        {wrap(TOPIK_LEVELS.map((l) => (
          <Chip key={l} label={l === 0 ? "No TOPIK" : `TOPIK ${l}`} selected={topik === l} onPress={() => setTopik(topik === l ? null : l)} />
        )))}
      </View>,
      <View key="v" style={{ gap: space.sm }}>
        {label("Visa type")}
        {wrap(VISAS.map((v) => <Chip key={v} label={v} selected={visa === v} onPress={() => setVisa(v)} />))}
        {visaNote(visa) ? <Text variant="small" color="accent">{visaNote(visa)}</Text> : null}
      </View>,
      <Row key="a" style={{ justifyContent: "space-between", marginTop: space.sm }}>
        <View style={{ flex: 1, paddingRight: space.md }}>
          <Text variant="heading">Email me new internships</Text>
          <Text variant="small">One email a day at most, only when there are new matches. Turn it off any time in Profile.</Text>
        </View>
        <Switch value={alerts} onValueChange={setAlerts} trackColor={{ true: c.accent, false: c.rule }} accessibilityLabel="Email me new internships" />
      </Row>,
      error ? <Text key="e" color="coral" variant="small">{error}</Text> : null,
    ],
  ];

  const last = step === STEPS - 1;
  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: c.bg }}>
      <Row style={{ paddingHorizontal: space.lg, paddingTop: space.sm, justifyContent: "space-between" }}>
        {step > 0 ? (
          <Pressable onPress={() => go(step - 1)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={24} color={c.ink} />
          </Pressable>
        ) : <View style={{ width: 24 }} />}
        <Row gap={6}>
          {Array.from({ length: STEPS }, (_, i) => <Dot key={i} active={i === step} done={i < step} />)}
        </Row>
        <Pressable onPress={leave} hitSlop={10} accessibilityRole="button">
          <Text variant="small" style={{ fontWeight: "700" }}>Skip</Text>
        </Pressable>
      </Row>
      {/* key = step, so each page mounts fresh and plays its entrance */}
      <SlideIn key={step} dir={nav.dir}>
        <Screen edges={[]}>
          {pages[step].filter(Boolean).map((part, i) => <Rise key={i} order={i}>{part}</Rise>)}
        </Screen>
      </SlideIn>
      <Rise order={step === 0 ? 7 : 0} style={{ padding: space.lg, paddingTop: space.sm }}>
        <Button title={last ? "Start using ICOM" : step === 0 ? "Get started" : "Next"} loading={busy}
          onPress={last ? finish : () => go(step + 1)} />
      </Rise>
    </SafeAreaView>
  );
}
