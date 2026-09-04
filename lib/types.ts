export type Member = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birthday: string | null;
  interests: string;
  membership_tier: string;
  membership_status: "pending" | "active" | "paused";
  joined_at: string;
  email_opt_in: number;
  sms_opt_in: number;
  notes: string;
};

export type ClubEvent = {
  id: string;
  title: string;
  description: string;
  event_date: string;
  end_date: string | null;
  location: string;
  category: string;
  title_cn?: string;
  description_cn?: string;
  location_cn?: string;
  category_cn?: string;
  capacity: number;
  status: "upcoming" | "completed" | "cancelled";
  attendee_count?: number;
};

export type Announcement = {
  id: string;
  title: string;
  message: string;
  title_cn?: string;
  message_cn?: string;
  kind: "event" | "promotion" | "community";
  published_at: string;
  featured: number;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  badge: string;
  name_cn?: string;
  description_cn?: string;
  category_cn?: string;
  badge_cn?: string;
  active: number;
};

export type ExpertProfileRecord = {
  id: string;
  name_en: string;
  name_cn: string;
  role_en: string;
  role_cn: string;
  biography_en: string;
  biography_cn: string;
  profile_url: string;
  sort_order: number;
  active: number;
  created_at: string;
  updated_at: string;
};

export type Attendance = {
  id: string;
  member_id: string;
  event_id: string;
  status: "registered" | "attended" | "completed";
  checked_in_at: string | null;
  first_name?: string;
  last_name?: string;
  event_title?: string;
  event_date?: string;
};

export type EventRegistration = {
  id: string;
  event_id: string;
  member_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  organization: string;
  job_title: string;
  language_preference: string;
  accessibility_notes: string;
  referral_source: string;
  marketing_opt_in: number;
  status: "registered" | "confirmed" | "cancelled" | "attended" | "completed";
  source: string;
  created_at: string;
  updated_at: string;
  event_title?: string;
  event_date?: string;
};

export type ActivityLog = {
  id: string;
  member_id: string | null;
  event_id: string | null;
  activity_type: string;
  description: string;
  actor_type: "member" | "admin" | "system";
  metadata: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  event_title?: string;
};
