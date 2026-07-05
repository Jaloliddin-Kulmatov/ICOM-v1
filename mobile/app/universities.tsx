import React, { useMemo, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  SectionList,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { UNIVERSITIES } from "@/data/universities";
import { Badge, Button, Card } from "@/components/ui";

type Uni = (typeof UNIVERSITIES)[number];

export default function UniversitiesScreen() {
  const [search, setSearch] = useState("");

  const sections = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = UNIVERSITIES.filter(
      (u) =>
        !q ||
        `${u.name} ${u.shortName} ${u.city} ${u.province}`.toLowerCase().includes(q)
    );
    const byProvince = new Map<string, Uni[]>();
    for (const u of filtered) {
      const list = byProvince.get(u.province) || [];
      list.push(u);
      byProvince.set(u.province, list);
    }
    return [...byProvince.entries()].map(([title, data]) => ({ title, data }));
  }, [search]);

  return (
    <SectionList
      className="flex-1 bg-background"
      contentContainerClassName="p-4 pb-12"
      sections={sections}
      keyExtractor={(u) => u.id}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View className="mb-3">
          <Text className="text-white text-2xl font-bold">Universities</Text>
          <Text className="text-muted mt-1 mb-3">
            {UNIVERSITIES.length} Korean universities in the ICOM directory.
          </Text>
          <View className="flex-row items-center bg-card border border-border rounded-xl px-3 mb-3">
            <Ionicons name="search" size={18} color="#8b8ba3" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search name or city…"
              placeholderTextColor="#5c5c73"
              className="flex-1 px-2 py-3 text-white"
            />
          </View>
          <Card className="border-icon-700 bg-icon-500/10">
            <Text className="text-white font-semibold">Represent your university 🎓</Text>
            <Text className="text-muted text-sm mt-1">
              Ambassadors post official news, welcome new students, and grow their campus
              community on ICOM.
            </Text>
            <Button
              title="Apply as Ambassador"
              onPress={() => router.push("/ambassador")}
              className="mt-3"
            />
          </Card>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <Text className="text-icon-300 font-semibold uppercase text-xs mt-4 mb-2">
          {section.title}
        </Text>
      )}
      renderItem={({ item: u }) => (
        <Pressable onPress={() => Linking.openURL(u.website)}>
          <Card className="mb-2.5 active:border-icon-500">
            <View className="flex-row items-center">
              <View
                className="rounded-xl w-10 h-10 items-center justify-center"
                style={{ backgroundColor: `${u.color}33` }}
              >
                <Text className="font-bold text-xs" style={{ color: u.color }}>
                  {u.shortName.slice(0, 4)}
                </Text>
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white font-medium" numberOfLines={1}>
                  {u.name}
                </Text>
                <Text className="text-muted text-xs mt-0.5">
                  {u.city} · ~{u.students.toLocaleString()} intl. students
                </Text>
              </View>
              <View className="items-end">
                {u.featured && <Badge label="Featured" tone="indigo" />}
                {u.intl && <Badge label="Intl. office" tone="green" />}
              </View>
            </View>
          </Card>
        </Pressable>
      )}
      ListEmptyComponent={
        <Text className="text-muted text-center mt-8">No universities match your search.</Text>
      }
    />
  );
}
