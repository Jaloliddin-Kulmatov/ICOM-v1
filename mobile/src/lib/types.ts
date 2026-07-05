// Shapes mirror the Flask backend's model to_dict() serializers (backend/models.py).

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  university?: string;
  visa_type?: string;
  country?: string;
  role: string;
  is_verified: boolean;
  job_alerts_enabled?: boolean;
  created_at?: string;
}

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  visa_compatible: string[];
  deadline: string;
  tags: string[];
  apply_link: string;
  foreigner_friendly: "yes" | "no" | "unclear" | "";
  foreigner_note: string;
  apply_count: number;
  is_active: boolean;
  created_at: string;
  isNew: boolean;
}

export interface ChatAnswer {
  id: number;
  post_id: number;
  user_id: number;
  author_name: string;
  author_university: string;
  author_country: string;
  content: string;
  created_at: string;
}

export interface ChatPost {
  id: number;
  user_id: number;
  author_name: string;
  author_university: string;
  author_country: string;
  title: string;
  content: string;
  scope: string; // "" = All Korea, otherwise a university token
  image_url: string;
  answer_count: number;
  created_at: string;
  answers?: ChatAnswer[];
}

export interface TopCompany {
  name: string;
  jobs: number;
}

export interface AiTurn {
  role: "user" | "assistant";
  content: string;
}

export interface Club {
  id: number;
  name: string;
  description: string;
  category: string;
  university: string;
  meeting_time: string;
  location: string;
  is_active: boolean;
  member_count: number;
  pending_count: number;
  my_status: "pending" | "approved" | null;
  is_creator: boolean;
  kakao_link: string | null; // members only — null until approved
  contact: string | null; // members only
  created_at: string;
  creator_name: string | null;
  club_type: "club" | "community";
  country: string;
  website: string;
  cover_image: string;
}

export interface ClubMember {
  membership_id: number | null;
  user_id: number;
  name: string;
  university: string | null;
  country: string | null;
  visa_type: string | null;
  joined_at: string;
}

export interface ClubMessage {
  id: number;
  club_id: number;
  user_id: number;
  author_name: string;
  content: string;
  reply_to_id: number | null;
  reply_to_name: string | null;
  reply_to_content: string | null;
  created_at: string;
}

export interface NewsPost {
  id: number;
  user_id: number;
  author_name: string;
  content: string;
  posted_as_type: "user" | "university" | "club" | "community";
  posted_as_label: string | null;
  club_id: number | null;
  created_at: string;
  comment_count: number;
}

export interface PostComment {
  id: number;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  author_name: string;
  content: string;
  created_at: string;
}

export interface Notice {
  id: number;
  source: string;
  category: string;
  title: string;
  title_ko: string;
  url: string;
  posted_date: string;
  created_at: string;
}

export interface SearchResult {
  type: "club" | "community" | "job";
  id: number;
  label: string;
  sub: string;
  category?: string;
  university?: string;
  country?: string;
  member_count?: number;
  company?: string;
  location?: string;
  job_type?: string;
  href: string;
}

export interface Restaurant {
  name: string;
  korean: string;
  type: string;
  price: string;
  rating: number;
  note: string;
  emoji: string;
}
