import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { api } from "./api";
import { APP_VERSION } from "./config";
import { getItem, removeItem, setItem } from "./storage";

const PUSH_KEY = "icom_push_token";
export const VISA_REMINDER_DAYS = [90, 60, 30, 7];

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false,
    }),
  });
}

async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "ICOM", importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/**
 * Visa reminders, scheduled on the phone (they fire even offline):
 * 90, 60, 30 and 7 days before expiry, at 10:00. Replaces earlier ones.
 * Returns how many reminders are now scheduled.
 */
export async function scheduleVisaReminders(expiry: string | undefined, visaType?: string): Promise<number> {
  if (Platform.OS === "web") return 0;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled
    .filter((n) => (n.content.data as { kind?: string } | null)?.kind === "visa")
    .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  if (!expiry || !/^\d{4}-\d{2}-\d{2}$/.test(expiry)) return 0;
  if (!(await ensurePermission())) return 0;
  const [y, m, d] = expiry.split("-").map(Number);
  let count = 0;
  for (const days of VISA_REMINDER_DAYS) {
    const when = new Date(y, m - 1, d - days, 10, 0, 0);
    if (when.getTime() <= Date.now()) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Your ${visaType || "visa"} expires in ${days} days`,
        body: `Expiry: ${expiry}. Apply to extend it at least 4 weeks before, on HiKorea or at the immigration office.`,
        data: { kind: "visa", url: "/guide/visa" },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
    });
    count++;
  }
  return count;
}

function projectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId || (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;
}

/**
 * Register this phone for push (new messages, answers to my questions).
 * Needs a real device and an EAS project ID (set when the app is built with
 * EAS); in Expo Go on Android or the web preview it quietly does nothing.
 */
export async function registerPush(): Promise<void> {
  try {
    if (Platform.OS === "web" || !Device.isDevice || !projectId()) return;
    if (!(await ensurePermission())) return;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: projectId() });
    const { error } = await api.post("/devices", { push_token: token, platform: Platform.OS, app_version: APP_VERSION });
    if (!error) await setItem(PUSH_KEY, token);
  } catch (e) {
    console.warn("Push registration skipped:", e);
  }
}

export async function unregisterPush(): Promise<void> {
  const token = await getItem(PUSH_KEY);
  if (!token) return;
  await api.delete("/devices", { push_token: token });
  await removeItem(PUSH_KEY);
}
