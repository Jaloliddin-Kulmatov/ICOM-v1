export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  university?: string;
  country?: string;
  visa?: string;
  role: "student" | "ambassador" | "admin";
  verified: boolean;
  joinedAt: string;
  bio?: string;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  imageUrl?: string;
  university?: string;
  tags: string[];
  likes: number;
  comments: Comment[];
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
  type: "post" | "announcement" | "event" | "alert";
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  createdAt: string;
  likes: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  type: "part-time" | "internship" | "research" | "full-time" | "remote";
  salary?: string;
  description: string;
  requirements: string[];
  visaCompatible: string[];
  postedAt: string;
  deadline?: string;
  applications: number;
  applyCount?: number;
  isBookmarked?: boolean;
  tags: string[];
  isNew?: boolean;
  isHot?: boolean;
  applyLink?: string;
  // AI-detected on Wanted scrapes. Empty string on admin-entered jobs.
  foreignerFriendly?: "yes" | "no" | "unclear" | "";
  foreignerNote?: string;
}

export interface University {
  id: string;
  name: string;
  shortName: string;
  color: string;
  students: number;
  ambassadors: Ambassador[];
  announcements: Announcement[];
  location: string;
  website: string;
  founded: number;
  ranking?: number;
}

export interface Ambassador {
  id: string;
  user: User;
  university: string;
  department: string;
  year: number;
  verified: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "info" | "event" | "urgent" | "scholarship";
  university?: string;
  createdAt: string;
  expiresAt?: string;
  author: User;
}

export interface Notification {
  id: string;
  type: "like" | "comment" | "follow" | "announcement" | "job" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  href?: string;
}

export interface SupportGuide {
  id: string;
  title: string;
  category: string;
  content: string;
  difficulty: "easy" | "medium" | "hard";
  readTime: number;
  updatedAt: string;
  helpful: number;
}
