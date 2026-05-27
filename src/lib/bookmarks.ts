import type { Job } from "@/types";

const JOBS_KEY  = "icom_saved_jobs";
const POSTS_KEY = "icom_saved_posts";

export interface SavedPost {
  id: number;
  author_name: string;
  content: string;
  created_at: string;
  posted_as_label: string | null;
  posted_as_type: string;
}

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch { return []; }
}

function write<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(new Event("bookmarks-changed"));
}

export const Bookmarks = {
  jobs: {
    getAll: (): Job[]      => read<Job>(JOBS_KEY),
    has:    (id: string)   => read<Job>(JOBS_KEY).some(j => j.id === id),
    toggle: (job: Job): boolean => {
      const list = read<Job>(JOBS_KEY);
      const idx  = list.findIndex(j => j.id === job.id);
      if (idx >= 0) { list.splice(idx, 1); write(JOBS_KEY, list); return false; }
      write(JOBS_KEY, [{ ...job, isBookmarked: true }, ...list]);
      return true;
    },
  },
  posts: {
    getAll: (): SavedPost[]    => read<SavedPost>(POSTS_KEY),
    has:    (id: number)       => read<SavedPost>(POSTS_KEY).some(p => p.id === id),
    toggle: (post: SavedPost): boolean => {
      const list = read<SavedPost>(POSTS_KEY);
      const idx  = list.findIndex(p => p.id === post.id);
      if (idx >= 0) { list.splice(idx, 1); write(POSTS_KEY, list); return false; }
      write(POSTS_KEY, [post, ...list]);
      return true;
    },
  },
};
