import { useMemo } from "react";
import { useApi } from "./use-api";
import type { Job } from "@/lib/types";

// Scholarships, contests and programs share the list on the website's
// Opportunities page; the app shows jobs only until it gets those tabs too.
const NOT_JOBS = ["scholarship", "contest", "program"];

// The job list (internships and part-time jobs), shared by Home, Jobs and the welcome.
export function useJobs() {
  const { data, loading, refreshing, error, reload, pull } = useApi<{ jobs: Job[] }>("/admin/jobs");
  const jobs = useMemo(() => (data?.jobs || []).filter((j) => !NOT_JOBS.includes(j.type)), [data]);
  const internships = useMemo(() => jobs.filter((j) => j.type !== "part-time"), [jobs]);
  const partTime = useMemo(() => jobs.filter((j) => j.type === "part-time"), [jobs]);
  return { jobs, internships, partTime, loading, refreshing, error, reload, pull };
}
