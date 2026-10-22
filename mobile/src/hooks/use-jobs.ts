import { useMemo } from "react";
import { useApi } from "./use-api";
import type { Job } from "@/lib/types";

// The job list (internships and part-time jobs), shared by Home, Jobs and the welcome.
export function useJobs() {
  const { data, loading, refreshing, error, reload, pull } = useApi<{ jobs: Job[] }>("/admin/jobs");
  const jobs = useMemo(() => data?.jobs || [], [data]);
  const internships = useMemo(() => jobs.filter((j) => j.type !== "part-time"), [jobs]);
  const partTime = useMemo(() => jobs.filter((j) => j.type === "part-time"), [jobs]);
  return { jobs, internships, partTime, loading, refreshing, error, reload, pull };
}
