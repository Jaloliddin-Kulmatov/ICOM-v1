import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { ARRIVAL_STEPS, daysUntil } from "@/lib/options";
import { GUIDE_ICONS, sortedGuides } from "@/lib/guides";
import { space, useColors } from "@/lib/theme";
import { Card, Icon, Row, Screen, Text } from "@/components/ui";

export default function GuideTab() {
  const { user, refresh } = useAuth();
  const c = useColors();
  const [done, setDone] = useState<string[]>(user?.checklist || []);
  const days = daysUntil(user?.visa_expiry);

  const toggle = async (id: string) => {
    const prev = done;
    const next = done.includes(id) ? done.filter((d) => d !== id) : [...done, id];
    setDone(next);
    const { error } = await api.put("/auth/me/checklist", { done: next });
    if (error) setDone(prev); else refresh();
  };

  return (
    <Screen>
      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <Text variant="heading">Arrival checklist</Text>
          <Text variant="small" color="accent" style={{ fontWeight: "800" }}>{done.length}/{ARRIVAL_STEPS.length}</Text>
        </Row>
        {ARRIVAL_STEPS.map((s) => {
          const isDone = done.includes(s.id);
          return (
            <View key={s.id} style={{ flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: 6 }}>
              <Pressable onPress={() => toggle(s.id)} accessibilityRole="checkbox" accessibilityState={{ checked: isDone }}
                accessibilityLabel={s.title} hitSlop={10}
                style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: c.accent,
                  backgroundColor: isDone ? c.accent : "transparent", alignItems: "center", justifyContent: "center" }}>
                {isDone && <Ionicons name="checkmark" size={16} color={c.onAccent} />}
              </Pressable>
              <Pressable style={{ flex: 1 }} onPress={() => router.push(`/guide/${s.guide}`)}>
                <Text style={{ fontWeight: "600", textDecorationLine: isDone ? "line-through" : "none", color: isDone ? c.muted : c.ink }}>{s.title}</Text>
                <Text variant="small">{s.note}</Text>
              </Pressable>
            </View>
          );
        })}
      </Card>

      <Card onPress={() => router.push("/profile")}>
        <Row><Icon name="notifications-outline" /><Text variant="heading">Visa reminders</Text></Row>
        <Text variant="small">
          {days == null ? "Add your visa expiry date in your profile. Your phone will remind you 90, 60, 30 and 7 days before, even offline."
            : days < 0 ? `Your visa expired on ${user?.visa_expiry}. Update the date in your profile.`
            : `On. ${days} days until ${user?.visa_expiry}. Reminders at 90, 60, 30 and 7 days.`}
        </Text>
      </Card>

      <Text variant="label" style={{ marginTop: space.sm }}>Guides (work offline)</Text>
      {sortedGuides().map((g) => (
        <Card key={g.slug} onPress={() => router.push(`/guide/${g.slug}`)} accessibilityLabel={g.title}>
          <Row>
            <Icon name={(GUIDE_ICONS[g.slug] || "book-outline") as never} size={20} />
            <View style={{ flex: 1 }}>
              <Text variant="heading">{g.title}</Text>
              <Text variant="small">Updated {g.updated}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.muted} />
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
