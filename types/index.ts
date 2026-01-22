// Core Data Types

export type ItemCategory = 'Finance' | 'Education' | 'Shopping' | 'Health' | 'Career' | 'Other';
export type ItemStatus = 'new' | 'paid' | 'archived';
export type AlertType = 'success' | 'error' | 'warning' | 'info';
export type SourceType = 'scan' | 'email' | 'manual';
export type AccountType = 'personal' | 'work' | 'business';
export type GuardianAlertType = 'deadline_7day' | 'deadline_1day' | 'overdue' | 'scam_warning';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  is_premium: boolean;
  push_notifications_enabled: boolean;
  reminder_7day_enabled: boolean;
  reminder_1day_enabled: boolean;
  created_at: string;
}

export interface NotificationSettings {
  push_notifications_enabled: boolean;
  reminder_7day_enabled: boolean;
  reminder_1day_enabled: boolean;
}

export interface Item {
  id: string;
  user_id: string;
  title: string;
  category: ItemCategory;
  amount: number | null;
  due_date: string | null;
  summary: string[];
  status: ItemStatus;
  image_url: string | null;
  is_scam: boolean;
  created_at: string;
  folder_id: string | null;
  source_type: SourceType;
  email_id: string | null;
  email_account_id: string | null;
  life_stack_id: string | null;
  risk_score: number;
}

export interface VaultFolder {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  item_count?: number;
}

export interface EmailAccount {
  id: string;
  user_id: string;
  email: string;
  account_type: AccountType;
  access_token: string;
  refresh_token: string;
  last_sync_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface LifeStack {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
  created_at: string;
  item_count?: number;
}

export interface GuardianAlert {
  id: string;
  user_id: string;
  item_id: string;
  alert_type: GuardianAlertType;
  trigger_date: string;
  is_dismissed: boolean;
  is_sent: boolean;
  created_at: string;
}

// AI Response Types

export interface DocumentAnalysis {
  title: string;
  amount: number | null;
  due_date: string | null;
  category: ItemCategory;
  summary_bullets: string[];
  is_scam: boolean;
  risk_score?: number;
  scam_indicators?: string[];
}

// UI State Types

export interface FilterState {
  activeCategory: ItemCategory | 'All';
}

export interface ScanState {
  isCapturing: boolean;
  isAnalyzing: boolean;
  capturedImage: string | null;
  analysisResult: DocumentAnalysis | null;
  error: string | null;
}

export interface SearchState {
  query: string;
  results: Item[];
  isSearching: boolean;
}

// Alert Types

export interface Alert {
  id: string;
  message: string;
  type: AlertType;
}
