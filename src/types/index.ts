export type MedicationForm = 
  | 'tablet' 
  | 'capsule' 
  | 'liquid' 
  | 'inhaler' 
  | 'injection' 
  | 'drops' 
  | 'patch';

export type FoodTiming = 
  | 'before_food' 
  | 'with_food' 
  | 'after_food' 
  | 'anytime';

export type FrequencyType = 
  | 'daily' 
  | 'twice_daily' 
  | 'three_daily' 
  | 'specific_days' 
  | 'as_needed';

export type DoseStatus = 
  | 'taken' 
  | 'skipped' 
  | 'snoozed' 
  | 'missed' 
  | 'pending';

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string; // e.g. "10mg" or "1 tablet"
  form: MedicationForm;
  color: string; // hex or color token
  shape: 'round' | 'oval' | 'capsule' | 'dropper' | 'bottle' | 'spray';
  frequency: FrequencyType;
  scheduledTimes: string[]; // ["08:00", "20:00"]
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday ...
  foodTiming: FoodTiming;
  purpose: string; // e.g. "Blood pressure control"
  instructions?: string;
  remainingPills: number;
  totalPills: number;
  refillThreshold: number;
  doctorName?: string;
  pharmacyPhone?: string;
  active: boolean;
  createdAt: string;
}

export interface DoseLog {
  id: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string; // HH:MM
  scheduledDate: string; // YYYY-MM-DD
  actualTime?: string; // ISO string
  status: DoseStatus;
  reasonIfSkipped?: string;
  notes?: string;
  snoozedUntil?: string; // ISO string
  synced: boolean;
  syncedAt?: string;
}

export interface CaregiverContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  notifyOnMissed: boolean;
  notifyThresholdMinutes: number; // e.g. 30 mins after scheduled time
  emergencyContact: boolean;
}

export interface CaregiverAlertMessage {
  id: string;
  timestamp: string;
  caregiverName: string;
  recipientPhone: string;
  recipientEmail: string;
  medicationName: string;
  scheduledTime: string;
  type: 'missed_dose' | 'refill_needed' | 'manual_sos' | 'daily_summary';
  status: 'sent' | 'delivered';
  messageText: string;
}

export interface UserProfile {
  id: string;
  name: string;
  pin: string;
  hasBiometrics: boolean;
  biometricRegisteredDate?: string;
  allergies: string[];
  medicalConditions: string[];
  caregiver: CaregiverContact;
  seniorMode: boolean;
  highContrast: boolean;
  darkMode: boolean;
  soundEnabled: boolean;
  voiceGuidance: boolean;
  e2eEncryptionEnabled: boolean;
  lastBackupDate?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  lastSyncedAt: string | null;
}
