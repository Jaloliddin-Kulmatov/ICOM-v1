import React, { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { registerForPushNotifications } from "@/lib/notifications";
import { Avatar, Button, Card, ErrorBanner, Input } from "@/components/ui";

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [university, setUniversity] = useState(user?.university || "");
  const [country, setCountry] = useState(user?.country || "");
  const [visaType, setVisaType] = useState(user?.visa_type || "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  if (!user) return null;

  const save = async () => {
    setBusy(true);
    setError(null);
    const err = await updateProfile({
      name: name.trim(),
      university: university.trim(),
      country: country.trim(),
      visa_type: visaType.trim(),
    });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setEditing(false);
  };

  const enablePush = async () => {
    setPushStatus("Requesting permission…");
    const token = await registerForPushNotifications();
    setPushStatus(
      token
        ? "Push notifications enabled on this device."
        : "Push not available (denied, simulator, or web)."
    );
  };

  const confirmLogout = () => {
    Alert.alert("Sign out?", "You can sign back in anytime.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-12">
      <View className="items-center mt-4 mb-6">
        <Avatar name={user.name} size={80} />
        <Text className="text-white text-xl font-bold mt-3">{user.name}</Text>
        <Text className="text-muted text-sm mt-0.5">{user.email}</Text>
        {user.role === "admin" && (
          <Text className="text-icon-300 text-xs mt-1 uppercase font-semibold">Admin</Text>
        )}
      </View>

      <ErrorBanner message={error} />

      {editing ? (
        <Card>
          <Input label="Full name" value={name} onChangeText={setName} />
          <Input
            label="University"
            value={university}
            onChangeText={setUniversity}
            placeholder="e.g. JBNU"
          />
          <Input
            label="Country"
            value={country}
            onChangeText={setCountry}
            placeholder="e.g. Uzbekistan"
          />
          <Input
            label="Visa type"
            value={visaType}
            onChangeText={setVisaType}
            placeholder="e.g. D-2"
          />
          <Button title="Save Changes" onPress={save} loading={busy} />
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => setEditing(false)}
            className="mt-2"
          />
        </Card>
      ) : (
        <Card>
          {(
            [
              ["University", user.university],
              ["Country", user.country],
              ["Visa type", user.visa_type],
            ] as [string, string | undefined][]
          ).map(([label, value], i) => (
            <View
              key={label}
              className={`flex-row justify-between py-3 ${i > 0 ? "border-t border-border" : ""}`}
            >
              <Text className="text-muted">{label}</Text>
              <Text className="text-white font-medium">{value?.trim() || "Not set"}</Text>
            </View>
          ))}
          <Button
            title="Edit Profile"
            variant="outline"
            onPress={() => {
              setName(user.name);
              setUniversity(user.university || "");
              setCountry(user.country || "");
              setVisaType(user.visa_type || "");
              setEditing(true);
            }}
            className="mt-3"
          />
        </Card>
      )}

      <Card className="mt-4">
        <Text className="text-white font-semibold mb-1">Push notifications</Text>
        <Text className="text-muted text-sm mb-3">
          Get notified about new internships and answers to your questions.
        </Text>
        <Button title="Enable on This Device" variant="outline" onPress={enablePush} />
        {pushStatus && <Text className="text-muted text-xs mt-2">{pushStatus}</Text>}
      </Card>

      <Button title="Sign Out" variant="danger" onPress={confirmLogout} className="mt-6" />

      <Text className="text-muted text-xs text-center mt-6">
        ICOM — International Community in Korea · icom.ai.kr
      </Text>
    </ScrollView>
  );
}
