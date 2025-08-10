export interface Application {
  id: string;
  user_id: string;
  source: 'gmail' | 'manual';
  company: string;
  role: string | null;
  location: string | null;
  status: 'applied' | 'assessment' | 'interview' | 'offer' | 'rejected' | 'ghosted' | 'withdrawn' | 'other';
  job_post_url: string | null;
  applied_at: string | null;
  email_id: string | null;
  thread_id: string | null;
  snippet: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Legacy interface for existing components
export interface LegacyApplication {
  id: string;
  company: string;
  role: string;
  status: "PENDING" | "REJECTED" | "ASSESSMENT" | "INTERVIEW" | "OFFER";
  applicationDate: Date;
  deadline?: Date;
  source: "gmail" | "manual";
  gmailMessageId?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  google_provider_id: string | null;
  created_at: string;
  updated_at: string;
}