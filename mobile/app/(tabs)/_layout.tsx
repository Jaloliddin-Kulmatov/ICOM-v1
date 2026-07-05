import React from "react";
import { Pressable, View } from "react-native";
import { Redirect, router, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { LoadingScreen } from "@/components/ui";

// Search + AI assistant are reachable from every tab's header, mirroring the
// web app's global search bar and floating AI widget.
function HeaderActions() {
  return (
    <View style={{ flexDirection: "row", marginRight: 12 }}>
      <Pressable onPress={() => router.push("/search")} style={{ padding: 6 }}>
        <Ionicons name="search" size={21} color="#a8a8ff" />
      </Pressable>
      <Pressable onPress={() => router.push("/ai")} style={{ padding: 6, marginLeft: 4 }}>
        <Ionicons name="sparkles" size={21} color="#a8a8ff" />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#0d0d1a" },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "600" },
        headerRight: () => <HeaderActions />,
        tabBarStyle: {
          backgroundColor: "#0d0d1a",
          borderTopColor: "#26263a",
        },
        tabBarActiveTintColor: "#7c7cff",
        tabBarInactiveTintColor: "#8b8ba3",
        sceneStyle: { backgroundColor: "#050508" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerTitle: "ICOM",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="internships"
        options={{
          title: "Internships",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          headerTitle: "Community Q&A",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
