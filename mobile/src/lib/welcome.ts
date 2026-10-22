import { useEffect, useState } from "react";
import { api } from "./api";
import { getItem, removeItem, setItem } from "./storage";

// The welcome runs before sign-up, so its answers wait on the phone until
// there is an account, then go to the profile on the first signed-in open.
export const WELCOME_SEEN = "welcome_seen";
const ANSWERS = "welcome_answers";

export type WelcomeAnswers = {
  goals: string[]; job_field: string; city: string; topik_level: number | null; visa_type: string; alerts: boolean;
};

export async function saveWelcomeAnswers(a: WelcomeAnswers): Promise<void> {
  await setItem(ANSWERS, JSON.stringify(a));
}

export async function loadWelcomeAnswers(): Promise<WelcomeAnswers | null> {
  try { return JSON.parse((await getItem(ANSWERS)) || "null"); } catch { return null; }
}

/** Saves answers to the signed-in user's profile. Only filled-in answers are sent. */
export async function saveAnswersToProfile(a: WelcomeAnswers): Promise<string | null> {
  const body: Record<string, unknown> = {};
  if (a.job_field) body.job_field = a.job_field;
  if (a.city) body.city = a.city;
  if (a.topik_level !== null) body.topik_level = a.topik_level;
  if (a.visa_type) body.visa_type = a.visa_type;
  if (Object.keys(body).length) {
    const { error } = await api.patch("/auth/me", body);
    if (error) return error;
  }
  if (a.alerts) await api.post("/admin/jobs/alerts", { enabled: true, field: a.job_field, city: a.city });
  await setItem("welcome_goals", JSON.stringify(a.goals));
  return null;
}

/** What the person said they're looking for in the welcome ("internship", "part-time", …). */
export function useWelcomeGoals(): string[] {
  const [goals, setGoals] = useState<string[]>([]);
  useEffect(() => {
    let live = true;
    getItem("welcome_goals").then((v) => {
      try { if (live) setGoals(JSON.parse(v || "[]")); } catch { /* old or empty value */ }
    });
    return () => { live = false; };
  }, []);
  return goals;
}

/** After sign-up or sign-in: apply answers given before the account existed. True if anything was saved. */
export async function applyPendingWelcomeAnswers(): Promise<boolean> {
  const a = await loadWelcomeAnswers();
  if (!a) return false;
  const error = await saveAnswersToProfile(a);
  if (error) return false;   // keep them and try again next open
  await removeItem(ANSWERS);
  return true;
}
