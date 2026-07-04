import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { api } from "./api";

// Ask for permission and get an Expo push token, then hand it to the backend.
// The backend endpoint (/auth/push-token) doesn't exist yet — until it ships,
// the POST 404s and we swallow it, so calling this is always safe.
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  if (!Device.isDevice) return null; // simulators can't receive push

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "ICOM",
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: "#6366f1",
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") return null;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    await api.post("/auth/push-token", { token, platform: Platform.OS });
    return token;
  } catch {
    return null;
  }
}
