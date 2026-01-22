-- GryLin Database Schema
-- This schema defines the tables, RLS policies, and triggers for the GryLin app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
-- Stores user profile information linked to auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  push_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_7day_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_1day_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- VAULT_FOLDERS TABLE
-- ============================================
-- Stores user-created folders for organizing items
CREATE TABLE IF NOT EXISTS vault_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on vault_folders
ALTER TABLE vault_folders ENABLE ROW LEVEL SECURITY;

-- Vault Folders RLS Policies
CREATE POLICY "Users can view their own folders"
  ON vault_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders"
  ON vault_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
  ON vault_folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
  ON vault_folders FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- EMAIL_ACCOUNTS TABLE
-- ============================================
-- Stores linked Gmail accounts for email integration
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('personal', 'work', 'business')),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  last_sync_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on email_accounts
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;

-- Email Accounts RLS Policies
CREATE POLICY "Users can view their own email accounts"
  ON email_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own email accounts"
  ON email_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email accounts"
  ON email_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email accounts"
  ON email_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- LIFE_STACKS TABLE
-- ============================================
-- Stores custom user-defined categories for organizing items
CREATE TABLE IF NOT EXISTS life_stacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on life_stacks
ALTER TABLE life_stacks ENABLE ROW LEVEL SECURITY;

-- Life Stacks RLS Policies
CREATE POLICY "Users can view their own life stacks"
  ON life_stacks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own life stacks"
  ON life_stacks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own life stacks"
  ON life_stacks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own life stacks"
  ON life_stacks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ITEMS TABLE
-- ============================================
-- Stores scanned documents and manually entered records
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Finance', 'Education', 'Shopping', 'Health', 'Career', 'Other')),
  amount DECIMAL(10, 2),
  due_date TIMESTAMPTZ,
  summary TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'paid', 'archived')),
  image_url TEXT,
  is_scam BOOLEAN NOT NULL DEFAULT FALSE,
  folder_id UUID REFERENCES vault_folders(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('scan', 'email', 'manual')),
  email_id TEXT,
  email_account_id UUID REFERENCES email_accounts(id) ON DELETE SET NULL,
  life_stack_id UUID REFERENCES life_stacks(id) ON DELETE SET NULL,
  risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on items
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Items RLS Policies
CREATE POLICY "Users can view their own items"
  ON items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own items"
  ON items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
  ON items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
  ON items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- GUARDIAN_ALERTS TABLE
-- ============================================
-- Stores proactive notifications for deadlines and scam detection
CREATE TABLE IF NOT EXISTS guardian_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('deadline_7day', 'deadline_1day', 'overdue', 'scam_warning')),
  trigger_date TIMESTAMPTZ NOT NULL,
  is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  is_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on guardian_alerts
ALTER TABLE guardian_alerts ENABLE ROW LEVEL SECURITY;

-- Guardian Alerts RLS Policies
CREATE POLICY "Users can view their own alerts"
  ON guardian_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alerts"
  ON guardian_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON guardian_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON guardian_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- INDEXES
-- ============================================
-- Index for faster queries on items by user and category
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_due_date ON items(due_date);
CREATE INDEX IF NOT EXISTS idx_items_folder_id ON items(folder_id);
CREATE INDEX IF NOT EXISTS idx_items_source_type ON items(source_type);
CREATE INDEX IF NOT EXISTS idx_items_email_account_id ON items(email_account_id);
CREATE INDEX IF NOT EXISTS idx_items_life_stack_id ON items(life_stack_id);
CREATE INDEX IF NOT EXISTS idx_vault_folders_user_id ON vault_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_life_stacks_user_id ON life_stacks(user_id);
CREATE INDEX IF NOT EXISTS idx_guardian_alerts_user_id ON guardian_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_guardian_alerts_item_id ON guardian_alerts(item_id);
CREATE INDEX IF NOT EXISTS idx_guardian_alerts_trigger_date ON guardian_alerts(trigger_date);

-- ============================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STORAGE BUCKET SETUP (run in Supabase dashboard)
-- ============================================
-- Note: Storage bucket creation should be done via Supabase dashboard or CLI
-- Bucket name: vault
-- Public: false
-- Allowed MIME types: image/jpeg, image/png, image/webp
-- Max file size: 10MB
