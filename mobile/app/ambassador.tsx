import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button, Card, ErrorBanner, Input } from "@/components/ui";

export default function AmbassadorScreen() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [university, setUniversity] = useState(user?.university || "");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [country, setCountry] = useState(user?.country || "");
  const [social, setSocial] = useState("");
  const [motivation, setMotivation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim() || !university.trim()) {
      setError("Name and university are required.");
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error: err } = await api.post<{ message: string }>("/ambassador/apply", {
      name: name.trim(),
      university: university.trim(),
      department: department.trim(),
      year: year.trim(),
      country: country.trim(),
      visa_type: user?.visa_type || "",
      motivation: motivation.trim(),
      social: social.trim(),
    });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setDone(data?.message || "Application submitted!");
  };

  if (done) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <View className="bg-emerald-500/15 rounded-full w-16 h-16 items-center justify-center">
          <Ionicons name="checkmark" size={30} color="#34d399" />
        </View>
        <Text className="text-white text-xl font-bold mt-4 text-center">{done}</Text>
        <Text className="text-muted text-sm text-center mt-2">
          We review applications regularly and will contact you at {user?.email}.
        </Text>
        <Button title="Back" variant="outline" onPress={() => router.back()} className="mt-6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerClassName="p-4 pb-10" keyboardShouldPersistTaps="handled">
        <Card className="mb-5 border-icon-700 bg-icon-500/10">
          <Text className="text-white font-semibold">What ambassadors do</Text>
          <Text className="text-muted text-sm mt-1 leading-5">
            Post official university news on ICOM, welcome incoming international students,
            and represent your campus. Your application is sent from your ICOM account email.
          </Text>
        </Card>

        <ErrorBanner message={error} />

        <Input label="Full name" value={name} onChangeText={setName} />
        <Input
          label="University"
          value={university}
          onChangeText={setUniversity}
          placeholder="e.g. JBNU"
        />
        <Input
          label="Department (optional)"
          value={department}
          onChangeText={setDepartment}
          placeholder="e.g. Computer Science"
        />
        <Input
          label="Year (optional)"
          value={year}
          onChangeText={setYear}
          placeholder="e.g. 3"
          keyboardType="number-pad"
        />
        <Input
          label="Country (optional)"
          value={country}
          onChangeText={setCountry}
          placeholder="e.g. Uzbekistan"
        />
        <Input
          label="KakaoTalk / Instagram (optional)"
          value={social}
          onChangeText={setSocial}
          placeholder="How can we reach you?"
          autoCapitalize="none"
        />
        <Input
          label="Why do you want to be an ambassador?"
          value={motivation}
          onChangeText={setMotivation}
          placeholder="A few sentences…"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={{ minHeight: 110 }}
        />

        <Button title="Submit Application" onPress={submit} loading={busy} className="mt-2" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
