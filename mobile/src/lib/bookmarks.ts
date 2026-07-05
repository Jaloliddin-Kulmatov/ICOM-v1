import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Job } from "./types";

// Job bookmarks live on-device (AsyncStorage), mirroring the web app's
// localStorage approach in src/lib/bookmarks.ts — no backend involved.

const JOBS_KEY = "icom_saved_jobs";

async function read(): Promise<Job[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(JOBS_KEY)) || "[]");
  } catch {
    return [];
  }
}

export const Bookmarks = {
  getAll: read,

  has: async (id: number): Promise<boolean> => {
    return (await read()).some((j) => j.id === id);
  },

  toggle: async (job: Job): Promise<boolean> => {
    const list = await read();
    const idx = list.findIndex((j) => j.id === job.id);
    let saved: boolean;
    if (idx >= 0) {
      list.splice(idx, 1);
      saved = false;
    } else {
      list.unshift(job);
      saved = true;
    }
    await AsyncStorage.setItem(JOBS_KEY, JSON.stringify(list));
    return saved;
  },
};
