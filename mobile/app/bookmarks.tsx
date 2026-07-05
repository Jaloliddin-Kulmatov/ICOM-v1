import React, { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Bookmarks } from "@/lib/bookmarks";
import type { Job } from "@/lib/types";
import { Badge, Card, EmptyState, LoadingScreen } from "@/components/ui";

export default function BookmarksScreen() {
  const [jobs, setJobs] = useState<Job[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      Bookmarks.getAll().then(setJobs);
    }, [])
  );

  const remove = async (job: Job) => {
    await Bookmarks.toggle(job);
    setJobs(await Bookmarks.getAll());
  };

  if (jobs === null) return <LoadingScreen />;

  return (
    <FlatList
      className="flex-1 bg-background"
      data={jobs}
      keyExtractor={(j) => String(j.id)}
      contentContainerClassName="p-4 pb-10"
      ListEmptyComponent={
        <EmptyState
          title="No saved internships"
          subtitle="Tap the bookmark icon on any internship to keep it here."
        />
      }
      renderItem={({ item: job }) => (
        <Pressable onPress={() => router.push(`/internships/${job.id}`)}>
          <Card className="mb-3 active:border-icon-500">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-2">
                <Text className="text-white font-semibold text-base" numberOfLines={2}>
                  {job.title}
                </Text>
                <Text className="text-muted text-sm mt-0.5">{job.company}</Text>
              </View>
              <Pressable onPress={() => remove(job)} className="p-1">
                <Ionicons name="bookmark" size={20} color="#7c7cff" />
              </Pressable>
            </View>
            <View className="flex-row flex-wrap mt-3">
              {job.location ? <Badge label={job.location} tone="gray" /> : null}
              {job.type ? <Badge label={job.type} tone="indigo" /> : null}
            </View>
          </Card>
        </Pressable>
      )}
    />
  );
}
