-- Core database migration for Gmail Job Tracker
-- Create enums
DO $$ BEGIN
  CREATE TYPE application_status AS ENUM (
    'applied','assessment','interview','offer','rejected','ghosted','withdrawn','other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  google_provider_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT CHECK (source IN ('gmail','manual')) DEFAULT 'gmail',
  company TEXT NOT NULL,
  role TEXT,
  location TEXT,
  status application_status DEFAULT 'applied',
  job_post_url TEXT,
  applied_at TIMESTAMPTZ,
  email_id TEXT,
  thread_id TEXT,
  snippet TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sync_logs table
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('success','partial','error')) DEFAULT 'success',
  stats JSONB DEFAULT '{}'::jsonb,
  error TEXT
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; 
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS t_apps_touch ON public.applications;
CREATE TRIGGER t_apps_touch BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Create profile auto-insert function
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email;
  RETURN NEW;
END; 
$$ LANGUAGE plpgsql;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS t_on_auth_user_created ON auth.users;
CREATE TRIGGER t_on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
DROP POLICY IF EXISTS p_profiles_select ON public.profiles;
CREATE POLICY p_profiles_select ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS p_profiles_update ON public.profiles;
CREATE POLICY p_profiles_update ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for applications
DROP POLICY IF EXISTS p_apps_select ON public.applications;
CREATE POLICY p_apps_select ON public.applications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS p_apps_insert ON public.applications;
CREATE POLICY p_apps_insert ON public.applications FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS p_apps_update ON public.applications;
CREATE POLICY p_apps_update ON public.applications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS p_apps_delete ON public.applications;
CREATE POLICY p_apps_delete ON public.applications FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for sync_logs
DROP POLICY IF EXISTS p_sync_logs_select ON public.sync_logs;
CREATE POLICY p_sync_logs_select ON public.sync_logs FOR SELECT USING (auth.uid() = user_id);