import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Restaurant } from "@/lib/types";
import { Button, Card, ErrorBanner, Input } from "@/components/ui";

const TRANSPORT_TIPS = [
  ["🚌", "T-money card", "Buy at any convenience store — works on buses, subway, and taxis nationwide. Free transfers within 30 min."],
  ["🗺️", "Naver / Kakao Map", "Google Maps barely works in Korea. Naver Map has an English mode."],
  ["🚕", "Kakao T", "Order taxis without phone calls — set your destination in the app."],
  ["🚄", "KTX & buses", "Korail Talk app for trains; express buses are ~half the price and reach every city."],
] as const;

interface RestaurantsResult {
  korean: Restaurant[];
  foreign: Restaurant[];
}

export default function DailyLifeScreen() {
  const { user } = useAuth();
  const [city, setCity] = useState("Jeonju");
  const [result, setResult] = useState<RestaurantsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const find = async () => {
    setBusy(true);
    setError(null);
    const { data, error: err } = await api.post<RestaurantsResult>("/ai/restaurants", {
      city: city.trim() || "Jeonju",
      nationality: user?.country || "",
    });
    setBusy(false);
    if (err || !data) {
      setError(err || "Couldn't fetch recommendations.");
      return;
    }
    setResult(data);
  };

  const renderRestaurant = (r: Restaurant, i: number) => (
    <Card key={`${r.name}-${i}`} className="mb-3">
      <View className="flex-row items-start">
        <Text className="text-2xl mr-3">{r.emoji || "🍽️"}</Text>
        <View className="flex-1">
          <Text className="text-white font-semibold">{r.name}</Text>
          <Text className="text-muted text-xs mt-0.5">
            {[r.korean, r.type].filter(Boolean).join(" · ")}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-amber-300 text-sm">★ {r.rating}</Text>
          <Text className="text-muted text-xs mt-0.5">{r.price}</Text>
        </View>
      </View>
      {r.note ? <Text className="text-[#c9c9dc] text-sm mt-2 leading-5">{r.note}</Text> : null}
    </Card>
  );

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-12">
      <Text className="text-white text-2xl font-bold">Daily Life</Text>
      <Text className="text-muted mt-1 mb-5">
        Food and transport tips, personalised
        {user?.country ? ` for students from ${user.country}` : ""}.
      </Text>

      <Card className="mb-5">
        <Text className="text-white font-semibold mb-3">🍜 Find restaurants near you</Text>
        <Input
          label="Your city"
          value={city}
          onChangeText={setCity}
          placeholder="e.g. Jeonju, Seoul, Busan"
        />
        <Button
          title={busy ? "Asking the AI…" : "Get Recommendations"}
          onPress={find}
          loading={busy}
        />
      </Card>

      <ErrorBanner message={error} />

      {result && (
        <>
          {result.korean.length > 0 && (
            <>
              <Text className="text-white text-lg font-bold mb-3">Local Korean pick</Text>
              {result.korean.map(renderRestaurant)}
            </>
          )}
          {result.foreign.length > 0 && (
            <>
              <Text className="text-white text-lg font-bold mt-3 mb-3">
                International food in {city}
              </Text>
              {result.foreign.map(renderRestaurant)}
            </>
          )}
          <Text className="text-muted text-xs mb-5">
            AI-generated suggestions — double-check opening hours on Naver Map.
          </Text>
        </>
      )}

      <Text className="text-white text-lg font-bold mb-3">🚇 Getting around</Text>
      {TRANSPORT_TIPS.map(([emoji, title, tip]) => (
        <Card key={title} className="mb-3">
          <View className="flex-row items-start">
            <Text className="text-2xl mr-3">{emoji}</Text>
            <View className="flex-1">
              <Text className="text-white font-semibold">{title}</Text>
              <Text className="text-muted text-sm mt-1 leading-5">{tip}</Text>
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}
