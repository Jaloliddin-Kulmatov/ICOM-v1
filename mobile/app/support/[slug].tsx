import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { getGuide } from "@/data/guides";
import { Card, EmptyState } from "@/components/ui";

export default function GuideScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const guide = getGuide(slug || "");

  if (!guide) return <EmptyState title="Guide not found" />;

  return (
    <>
      <Stack.Screen options={{ title: guide.title }} />
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-12">
        <Text className="text-white text-2xl font-bold">{guide.title}</Text>
        <Text className="text-muted mt-1 mb-4">{guide.description}</Text>

        {guide.sections.map((s) => (
          <Card key={s.heading} className="mb-4">
            <Text className="text-icon-300 font-semibold text-base mb-2.5">{s.heading}</Text>
            {s.bullets.map((b, i) => (
              <View key={i} className={`flex-row ${i > 0 ? "mt-2" : ""}`}>
                <Text className="text-icon-400 mr-2">•</Text>
                <Text className="text-[#c9c9dc] flex-1 leading-6">{b}</Text>
              </View>
            ))}
          </Card>
        ))}

        <Text className="text-muted text-xs text-center mt-2">
          Rules change — always confirm with your university's international office or
          hikorea.go.kr.
        </Text>
      </ScrollView>
    </>
  );
}
