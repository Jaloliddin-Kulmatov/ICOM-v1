import { Alert } from "react-native";
import { api } from "./api";
import type { T } from "@/i18n";

type Target = "chat_post" | "chat_answer" | "club" | "user";
const NOUN: Record<Target, string> = { chat_post: "question", chat_answer: "answer", club: "club", user: "person" };

/** Ask to confirm, then send a report for an admin to review. Pass useT()'s t. */
export function confirmReport(target: Target, id: number, t: T) {
  Alert.alert(t(`Report this ${NOUN[target]}?`), t("An ICOM admin will review it. The person won't see who reported it."), [
    { text: t("Cancel"), style: "cancel" },
    { text: t("Report"), style: "destructive", onPress: async () => {
      const { error } = await api.post("/users/reports", { target_type: target, target_id: id, reason: "Reported from the app" });
      Alert.alert(error ? t("Couldn't send the report") : t("Thanks"), error || t("An admin will review this report."));
    } },
  ]);
}
