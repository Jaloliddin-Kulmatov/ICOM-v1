// The kinds of opportunity on /opportunities. They are all rows in the jobs
// table; `type` (job_type in the database) says which kind. Scraped postings
// use other job types (full-time, contract…), which count as internships.

export type Kind = "internship" | "part-time" | "scholarship" | "contest" | "program";

export const KINDS: { key: Kind; label: string; one: string; a: string; many: string; chip: string; intro: string }[] = [
  { key: "internship", label: "Internships", one: "internship", a: "an internship", many: "internships",
    chip: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    intro: "Real internships at companies in Korea, checked every day" },
  { key: "part-time", label: "Part-time", one: "part-time job", a: "a part-time job", many: "part-time jobs",
    chip: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
    intro: "Part-time jobs (알바) shared by students and checked by the ICOM team" },
  { key: "scholarship", label: "Scholarships", one: "scholarship", a: "a scholarship", many: "scholarships",
    chip: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
    intro: "Scholarships and grants that international students can apply for" },
  { key: "contest", label: "Contests", one: "contest", a: "a contest", many: "contests",
    chip: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
    intro: "Contests and competitions open to international students" },
  { key: "program", label: "Programs", one: "program", a: "a program", many: "programs",
    chip: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
    intro: "Trainings, camps and exchange programs for international students" },
];

export const kindOf = (type?: string | null): Kind =>
  (KINDS.some((k) => k.key === type) ? type : "internship") as Kind;

export const kindInfo = (type?: string | null) => KINDS.find((k) => k.key === kindOf(type))!;

/** Kinds students can share themselves; internships come from the daily scrape and admins. */
export const SHAREABLE: Kind[] = ["part-time", "scholarship", "contest", "program"];
