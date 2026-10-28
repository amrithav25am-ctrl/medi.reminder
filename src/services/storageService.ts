// Storage & Offline Sync Engine with E2EE Backup Support
import { 
  Medication, 
  DoseLog, 
  CaregiverContact, 
  CaregiverAlertMessage, 
  UserProfile, 
  SyncStatus, 
  DoseStatus 
} from '../types';
import { encryptData, decryptData, EncryptedPayload } from './encryptionService';

const STORAGE_KEYS = {
  MEDICATIONS: 'dosemate_medications_v1',
  DOSE_LOGS: 'dosemate_dose_logs_v1',
  USER_PROFILE: 'dosemate_user_profile_v1',
  CAREGIVER_ALERTS: 'dosemate_caregiver_alerts_v1',
  SYNC_QUEUE: 'dosemate_sync_queue_v1',
  ENCRYPTED_BACKUP: 'dosemate_cloud_snapshot_v1',
};

// Initial realistic default medications
export const INITIAL_MEDICATIONS: Medication[] = [
  {
    id: 'med-1',
    name: 'Lisinopril',
    genericName: 'Prinivil / Zestril',
    dosage: '10 mg (1 tablet)',
    form: 'tablet',
    color: '#fb7185', // rose
    shape: 'round',
    frequency: 'daily',
    scheduledTimes: ['08:00'],
    foodTiming: 'with_food',
    purpose: 'Blood pressure regulation',
    instructions: 'Take every morning with breakfast and a glass of water.',
    remainingPills: 18,
    totalPills: 30,
    refillThreshold: 7,
    doctorName: 'Dr. Sarah Mitchell, MD',
    pharmacyPhone: '(555) 234-5678',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med-2',
    name: 'Metformin HCl',
    genericName: 'Glucophage',
    dosage: '500 mg (1 tablet)',
    form: 'tablet',
    color: '#38bdf8', // sky blue
    shape: 'oval',
    frequency: 'twice_daily',
    scheduledTimes: ['08:00', '19:00'],
    foodTiming: 'with_food',
    purpose: 'Blood sugar & Type 2 Diabetes management',
    instructions: 'Take with morning and evening meals to minimize stomach upset.',
    remainingPills: 12,
    totalPills: 60,
    refillThreshold: 10,
    doctorName: 'Dr. Sarah Mitchell, MD',
    pharmacyPhone: '(555) 234-5678',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med-3',
    name: 'Atorvastatin',
    genericName: 'Lipitor',
    dosage: '20 mg (1 tablet)',
    form: 'tablet',
    color: '#a78bfa', // purple
    shape: 'oval',
    frequency: 'daily',
    scheduledTimes: ['21:00'],
    foodTiming: 'after_food',
    purpose: 'Cholesterol management',
    instructions: 'Take at bedtime. Avoid eating grapefruit while on this medication.',
    remainingPills: 25,
    totalPills: 30,
    refillThreshold: 5,
    doctorName: 'Dr. Robert Jenkins, Cardiologist',
    pharmacyPhone: '(555) 234-5678',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med-4',
    name: 'Vitamin D3 & Calcium',
    genericName: 'Cholecalciferol',
    dosage: '1000 IU (1 softgel)',
    form: 'capsule',
    color: '#fbbf24', // amber/gold
    shape: 'capsule',
    frequency: 'daily',
    scheduledTimes: ['12:30'],
    foodTiming: 'with_food',
    purpose: 'Bone strength and immunity support',
    instructions: 'Take with midday lunch.',
    remainingPills: 45,
    totalPills: 90,
    refillThreshold: 14,
    doctorName: 'Dr. Sarah Mitchell, MD',
    pharmacyPhone: '(555) 234-5678',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_CAREGIVER: CaregiverContact = {
  id: 'caregiver-1',
  name: 'Emily Davis',
  relationship: 'Daughter / Primary Caregiver',
  phone: '+1 (555) 892-4411',
  email: 'emily.davis@familycare.org',
  notifyOnMissed: true,
  notifyThresholdMinutes: 30,
  emergencyContact: true,
};

export const INITIAL_USER_PROFILE: UserProfile = {
  id: 'user-primary-1',
  name: 'Eleanor Vance',
  pin: '1234',
  hasBiometrics: true,
  biometricRegisteredDate: new Date().toISOString(),
  allergies: ['Penicillin', 'Sulfa drugs'],
  medicalConditions: ['Hypertension', 'Type 2 Diabetes', 'Osteopenia'],
  caregiver: INITIAL_CAREGIVER,
  seniorMode: false,
  highContrast: false,
  darkMode: false,
  soundEnabled: true,
  voiceGuidance: true,
  e2eEncryptionEnabled: true,
  lastBackupDate: new Date().toISOString(),
};

// Generate sample past dose logs for the last 5 days
function generateSeedDoseLogs(): DoseLog[] {
  const logs: DoseLog[] = [];
  const today = new Date();
  
  for (let i = 5; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Lisinopril
    logs.push({
      id: `log-seed-${dateStr}-1`,
      medicationId: 'med-1',
      medicationName: 'Lisinopril',
      scheduledTime: '08:00',
      scheduledDate: dateStr,
      actualTime: `${dateStr}T08:12:00.000Z`,
      status: 'taken',
      notes: 'Taken with oatmeal',
      synced: true,
    });

    // Metformin morning
    logs.push({
      id: `log-seed-${dateStr}-2`,
      medicationId: 'med-2',
      medicationName: 'Metformin HCl',
      scheduledTime: '08:00',
      scheduledDate: dateStr,
      actualTime: `${dateStr}T08:14:00.000Z`,
      status: 'taken',
      synced: true,
    });

    // Vitamin D midday
    logs.push({
      id: `log-seed-${dateStr}-3`,
      medicationId: 'med-4',
      medicationName: 'Vitamin D3 & Calcium',
      scheduledTime: '12:30',
      scheduledDate: dateStr,
      actualTime: i === 2 ? undefined : `${dateStr}T12:40:00.000Z`,
      status: i === 2 ? 'skipped' : 'taken',
      reasonIfSkipped: i === 2 ? 'Felt stomach fullness after soup' : undefined,
      synced: true,
    });

    // Metformin evening
    logs.push({
      id: `log-seed-${dateStr}-4`,
      medicationId: 'med-2',
      medicationName: 'Metformin HCl',
      scheduledTime: '19:00',
      scheduledDate: dateStr,
      actualTime: `${dateStr}T19:25:00.000Z`,
      status: 'taken',
      synced: true,
    });

    // Atorvastatin bedtime
    logs.push({
      id: `log-seed-${dateStr}-5`,
      medicationId: 'med-3',
      medicationName: 'Atorvastatin',
      scheduledTime: '21:00',
      scheduledDate: dateStr,
      actualTime: `${dateStr}T21:10:00.000Z`,
      status: 'taken',
      synced: true,
    });
  }

  return logs;
}

export class StorageService {
  public static getMedications(): Medication[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MEDICATIONS);
    if (!raw) {
      this.saveMedications(INITIAL_MEDICATIONS);
      return INITIAL_MEDICATIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_MEDICATIONS;
    }
  }

  public static saveMedications(meds: Medication[]) {
    localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(meds));
    this.recordSyncAction('SAVE_MEDICATIONS');
  }

  public static getDoseLogs(): DoseLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DOSE_LOGS);
    if (!raw) {
      const seed = generateSeedDoseLogs();
      this.saveDoseLogs(seed);
      return seed;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveDoseLogs(logs: DoseLog[]) {
    localStorage.setItem(STORAGE_KEYS.DOSE_LOGS, JSON.stringify(logs));
    this.recordSyncAction('SAVE_DOSE_LOGS');
  }

  public static logDose(
    medication: Medication,
    scheduledTime: string,
    scheduledDate: string,
    status: DoseStatus,
    reasonIfSkipped?: string,
    notes?: string,
    snoozedUntil?: string
  ): DoseLog {
    const logs = this.getDoseLogs();
    
    // Check if an existing entry exists for this medication, date, and time
    const existingIndex = logs.findIndex(
      l => l.medicationId === medication.id && l.scheduledDate === scheduledDate && l.scheduledTime === scheduledTime
    );

    const isOnline = navigator.onLine;
    const newEntry: DoseLog = {
      id: existingIndex >= 0 ? logs[existingIndex].id : `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      medicationId: medication.id,
      medicationName: medication.name,
      scheduledTime,
      scheduledDate,
      actualTime: status === 'taken' ? new Date().toISOString() : undefined,
      status,
      reasonIfSkipped,
      notes,
      snoozedUntil,
      synced: isOnline,
      syncedAt: isOnline ? new Date().toISOString() : undefined,
    };

    if (existingIndex >= 0) {
      logs[existingIndex] = newEntry;
    } else {
      logs.unshift(newEntry);
    }

    // Decrement pill inventory if taken
    if (status === 'taken') {
      const allMeds = this.getMedications();
      const medIndex = allMeds.findIndex(m => m.id === medication.id);
      if (medIndex >= 0 && allMeds[medIndex].remainingPills > 0) {
        allMeds[medIndex].remainingPills -= 1;
        this.saveMedications(allMeds);
      }
    }

    this.saveDoseLogs(logs);

    if (!isOnline) {
      this.queueSyncItem({ type: 'DOSE_LOG', data: newEntry });
    }

    return newEntry;
  }

  public static getUserProfile(): UserProfile {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!raw) {
      this.saveUserProfile(INITIAL_USER_PROFILE);
      return INITIAL_USER_PROFILE;
    }
    try {
      return { ...INITIAL_USER_PROFILE, ...JSON.parse(raw) };
    } catch {
      return INITIAL_USER_PROFILE;
    }
  }

  public static saveUserProfile(profile: UserProfile) {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    this.recordSyncAction('SAVE_USER_PROFILE');
  }

  public static getCaregiverAlerts(): CaregiverAlertMessage[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CAREGIVER_ALERTS);
    if (!raw) {
      return [
        {
          id: 'alert-sample-1',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          caregiverName: 'Emily Davis',
          recipientPhone: '+1 (555) 892-4411',
          recipientEmail: 'emily.davis@familycare.org',
          medicationName: 'Vitamin D3 & Calcium',
          scheduledTime: '12:30',
          type: 'missed_dose',
          status: 'delivered',
          messageText: 'Alert: Eleanor skipped dose: Felt stomach fullness after soup. Caregiver notified.',
        }
      ];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveCaregiverAlert(alert: CaregiverAlertMessage) {
    const alerts = this.getCaregiverAlerts();
    alerts.unshift(alert);
    localStorage.setItem(STORAGE_KEYS.CAREGIVER_ALERTS, JSON.stringify(alerts.slice(0, 50)));
  }

  // Offline Sync Management
  private static queueSyncItem(item: { type: string; data: unknown }) {
    const queue = this.getSyncQueue();
    queue.push(item);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  }

  public static getSyncQueue(): Array<{ type: string; data: unknown }> {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return raw ? JSON.parse(raw) : [];
  }

  public static flushSyncQueue(): number {
    const queue = this.getSyncQueue();
    const count = queue.length;
    if (count > 0) {
      // Mark all logs as synced
      const logs = this.getDoseLogs();
      const updatedLogs = logs.map(l => ({ ...l, synced: true, syncedAt: new Date().toISOString() }));
      this.saveDoseLogs(updatedLogs);
      localStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
      localStorage.setItem('dosemate_last_sync_timestamp', new Date().toISOString());
    }
    return count;
  }

  public static getSyncStatus(): SyncStatus {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const queue = this.getSyncQueue();
    const lastSyncedAt = localStorage.getItem('dosemate_last_sync_timestamp') || new Date().toISOString();
    return {
      isOnline,
      isSyncing: false,
      pendingSyncCount: queue.length,
      lastSyncedAt,
    };
  }

  private static recordSyncAction(_action: string) {
    if (navigator.onLine) {
      localStorage.setItem('dosemate_last_sync_timestamp', new Date().toISOString());
    }
  }

  // End-to-End Encryption Cloud Backup & Export
  public static async exportEncryptedBackup(passphrase?: string): Promise<string> {
    const payload = {
      userProfile: this.getUserProfile(),
      medications: this.getMedications(),
      doseLogs: this.getDoseLogs(),
      caregiverAlerts: this.getCaregiverAlerts(),
      exportDate: new Date().toISOString(),
    };

    const encrypted = await encryptData(payload, passphrase || 'DoseMate-E2EE-Vault-Key');
    return JSON.stringify(encrypted, null, 2);
  }

  public static async restoreEncryptedBackup(jsonContent: string, passphrase?: string): Promise<boolean> {
    try {
      const payload: EncryptedPayload = JSON.parse(jsonContent);
      const decrypted = await decryptData<{
        userProfile: UserProfile;
        medications: Medication[];
        doseLogs: DoseLog[];
        caregiverAlerts: CaregiverAlertMessage[];
      }>(payload, passphrase || 'DoseMate-E2EE-Vault-Key');

      if (decrypted.medications && Array.isArray(decrypted.medications)) {
        this.saveMedications(decrypted.medications);
      }
      if (decrypted.doseLogs && Array.isArray(decrypted.doseLogs)) {
        this.saveDoseLogs(decrypted.doseLogs);
      }
      if (decrypted.userProfile) {
        this.saveUserProfile(decrypted.userProfile);
      }
      if (decrypted.caregiverAlerts) {
        localStorage.setItem(STORAGE_KEYS.CAREGIVER_ALERTS, JSON.stringify(decrypted.caregiverAlerts));
      }
      return true;
    } catch (e) {
      console.error('Failed to restore encrypted backup:', e);
      return false;
    }
  }
}
