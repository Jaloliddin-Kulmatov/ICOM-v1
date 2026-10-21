import { Alert } from "react-native";
import { api } from "./api";

type Target = "chat_post" | "chat_answer" | "club" | "user";
const NOUN: Record<Target, string> = { chat_post: "question", chat_answer: "answer", club: "club", user: "person" };

/** Ask to confirm, then send a report for an admin to review. */
export function confirmReport(target: Target, id: number) {
  Alert.alert(`Report this ${NOUN[target]}?`, "An ICOM admin will review it. The person won't see who reported it.", [
    { text: "Cancel", style: "cancel" },
    { text: "Report", style: "destructive", onPress: async () => {
      const { error } = await api.post("/users/reports", { target_type: target, target_id: id, reason: "Reported from the app" });
      Alert.alert(error ? "Couldn't send the report" : "Thanks", error || "An admin will review this report.");
    } },
  ]);
}
