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
