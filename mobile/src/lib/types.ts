export type User = {
  id: number; name: string; email: string; university?: string; visa_type?: string; country?: string;
  role: string; visa_expiry?: string; topik_level?: number | null; job_field?: string; city?: string;
  checklist?: string[]; job_alerts_enabled?: boolean;
};

export type JobInsights = { korean_required: boolean; english_ok: boolean; visa_support: boolean; student_role: boolean };

export type Job = {
  id: number; title: string; company: string; location: string; type: string; salary: string;
  description: string; requirements: string[]; visa_compatible: string[]; deadline: string;
  tags: string[]; apply_link: string; foreigner_friendly: string; foreigner_note: string;
  apply_count: number; created_at: string; isNew: boolean; insights?: JobInsights;
};

export type Person = { id: number; name: string; university: string; country: string; visa_type: string; role: string };

export type ChatPost = {
  id: number; user_id: number; author_name: string; author_university: string; author_country: string;
  title: string; content: string; scope: string; answer_count: number; created_at: string; solved?: boolean;
  answers?: ChatAnswer[];
};
export type ChatAnswer = {
  id: number; post_id: number; user_id: number; author_name: string; author_university: string;
  content: string; created_at: string; is_accepted?: boolean;
};

export type Club = {
  id: number; name: string; description: string; category: string; university: string; club_type: string;
  meeting_time: string; location: string; member_count: number; my_status: string | null; is_creator: boolean;
  kakao_link: string | null; country: string;
};

export type ClubEvent = { id: number; club_id: number; title: string; starts_at: string; ends_at: string | null; location: string; description: string; club_name?: string };
