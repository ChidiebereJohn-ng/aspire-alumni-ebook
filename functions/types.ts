export interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
  ENVIRONMENT?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
}

export interface AlumniRecord {
  id: string;
  surname: string;
  first_name: string;
  photo_key: string | null;
  city: string | null;
  state: string | null;
  employer: string | null;
  role: string | null;
  industry: string | null;
  cohort_year: number;
  advice: string | null;
  status: 'pending' | 'approved' | 'hidden';
  edit_token: string;
  consent: number;
  linkedin_url?: string | null;
  hide_employer?: number;
  hide_city?: number;
  featured?: number;
  leadership_role?: 'lead_mentor' | 'team' | null;
  leadership_title?: string | null;
  country?: string;
  removed_at?: string | null;
  deleted_at?: string | null;
  source?: 'form' | 'import';
  created_at: string;
  updated_at: string;
}

export interface SettingsRecord {
  id: number;
  directory_public: number;
  ebook_public: number;
  updated_at: string;
}
