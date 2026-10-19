import { useApi } from "./use-api";
import type { Job } from "@/lib/types";

// The internship list, shared by Home and Jobs.
export function useJobs() {
  const { data, loading, refreshing, error, reload, pull } = useApi<{ jobs: Job[] }>("/admin/jobs");
  return { jobs: data?.jobs || [], loading, refreshing, error, reload, pull };
}
