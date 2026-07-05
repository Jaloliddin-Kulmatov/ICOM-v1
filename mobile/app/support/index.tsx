import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { GUIDES } from "@/data/guides";
import { Card } from "@/components/ui";

export default function SupportScreen() {
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-10">
      <Text className="text-white text-2xl font-bold">Support Guides</Text>
      <Text className="text-muted mt-1 mb-5">
        Step-by-step guides for living in Korea as an international student.
      </Text>

      {GUIDES.map((g) => (
        <Pressable key={g.slug} onPress={() => router.push(`/support/${g.slug}`)}>
          <Card className="mb-3 active:border-icon-500">
            <View className="flex-row items-center">
              <View className="bg-icon-500/15 rounded-xl w-11 h-11 items-center justify-center">
                <Ionicons name={g.icon} size={22} color="#7c7cff" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white font-semibold text-base">{g.title}</Text>
                <Text className="text-muted text-sm mt-0.5">{g.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8b8ba3" />
            </View>
          </Card>
        </Pressable>
      ))}

      <Pressable onPress={() => router.push("/ai")}>
        <Card className="mt-2 border-icon-700 bg-icon-500/10 active:border-icon-500">
          <View className="flex-row items-center">
            <Ionicons name="sparkles" size={20} color="#a8a8ff" />
            <View className="ml-3 flex-1">
              <Text className="text-white font-semibold">Can't find your answer?</Text>
              <Text className="text-muted text-sm mt-0.5">
                Ask the AI assistant — it knows these guides and ICOM's live data.
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>
    </ScrollView>
  );
}
