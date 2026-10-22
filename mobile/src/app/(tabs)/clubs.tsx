import React, { useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useApi } from "@/hooks/use-api";
import { CLUB_CATEGORIES } from "@/lib/options";
import { space, useColors } from "@/lib/theme";
import type { Club } from "@/lib/types";
import { Card, Chip, ChipRow, Empty, ErrorBox, Input, Loading, Row, Text } from "@/components/ui";
import { useT } from "@/i18n";

type Kind = "club" | "community" | "mine";

export default function ClubsTab() {
  const c = useColors();
  const { t, tn } = useT();
  const { data, loading, refreshing, error, reload, pull } = useApi<{ clubs: Club[] }>("/clubs");
  const clubs = useMemo(() => data?.clubs || [], [data]);
  const [kind, setKind] = useState<Kind>("club");
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");

  const mine = (x: Club) => x.is_creator || x.my_status === "approved" || x.my_status === "pending";
  const inKind = useMemo(() => clubs.filter((x) => kind === "mine" ? mine(x) : (x.club_type || "club") === kind), [clubs, kind]);
  const cats = useMemo(() => Array.from(new Set(inKind.map((x) => x.category))).filter((k) => CLUB_CATEGORIES[k]), [inKind]);
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const list = inKind.filter((x) => (cat === "all" || x.category === cat)
    && words.every((w) => `${x.name} ${x.description} ${x.country} ${x.university}`.toLowerCase().includes(w)));

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        data={list}
        keyExtractor={(x) => String(x.id)}
        contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xxl }}
        refreshing={refreshing}
        onRefresh={pull}
        ListHeaderComponent={
          <View style={{ gap: space.sm, marginBottom: space.sm }}>
            <ChipRow>
              <Chip label={t("My campus clubs")} selected={kind === "club"} onPress={() => { setKind("club"); setCat("all"); }} />
              <Chip label={t("Communities")} selected={kind === "community"} onPress={() => { setKind("community"); setCat("all"); }} />
              <Chip label={t("Mine")} selected={kind === "mine"} onPress={() => { setKind("mine"); setCat("all"); }} icon="person-outline" />
            </ChipRow>
            <Input value={q} onChangeText={setQ} placeholder={t("Search clubs and communities")} accessibilityLabel={t("Search clubs and communities")} />
            {cats.length > 1 && (
              <ChipRow>
                <Chip label={t("All")} selected={cat === "all"} onPress={() => setCat("all")} />
                {cats.map((k) => <Chip key={k} label={t(CLUB_CATEGORIES[k])} selected={cat === k} onPress={() => setCat(k)} />)}
              </ChipRow>
            )}
            {error ? <ErrorBox message={error} onRetry={reload} /> : null}
          </View>
        }
        ListEmptyComponent={loading ? <Loading /> : (
          <Empty icon="people-outline" title={kind === "mine" ? t("You haven't joined any yet") : t("Nothing here")}
            body={kind === "club" ? t("Clubs from your university show here. Check Communities for nationwide groups.") : undefined} />
        )}
        renderItem={({ item: x }) => (
          <Card onPress={() => router.push(`/club/${x.id}`)} accessibilityLabel={x.name}>
            <Text variant="heading">{x.name}</Text>
            <Text variant="small" numberOfLines={2}>{x.description}</Text>
            <Row style={{ flexWrap: "wrap" }} gap={6}>
              <Chip label={t(CLUB_CATEGORIES[x.category] || x.category)} />
              <Chip label={tn("members", x.member_count)} icon="people-outline" />
              {x.is_creator ? <Chip label={t("You run this")} tone="good" /> : x.my_status === "approved" ? <Chip label={t("Joined")} tone="good" />
                : x.my_status === "pending" ? <Chip label={t("Requested")} tone="teal" /> : null}
            </Row>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
