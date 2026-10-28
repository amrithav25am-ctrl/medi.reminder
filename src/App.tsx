import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StandardDashboard } from './components/StandardDashboard';
import { SeniorModeDashboard } from './components/SeniorModeDashboard';
import { HistoryCalendar } from './components/HistoryCalendar';
import { CaregiverAlertsModal } from './components/CaregiverAlertsModal';
import { BackupModal } from './components/BackupModal';
import { MedicationModal } from './components/MedicationModal';
import { DoseActionModal } from './components/DoseActionModal';
import { BiometricAuthModal } from './components/BiometricAuthModal';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';

import { Medication, DoseLog, UserProfile, SyncStatus, CaregiverContact } from './types';
import { StorageService } from './services/storageService';
import { notificationService } from './services/notificationService';
import { playDoseAlert, playSuccessChime, playWarningTone, speakText } from './services/soundService';

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => StorageService.getUserProfile());
  const [medications, setMedications] = useState<Medication[]>(() => StorageService.getMedications());
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>(() => StorageService.getDoseLogs());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => StorageService.getSyncStatus());

  const [currentTab, setCurrentTab] = useState<'schedule' | 'history' | 'caregiver' | 'backup'>('schedule');
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Modals state
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);

  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionParams, setActionParams] = useState<{
    med: Medication | null;
    time: string;
    type: 'take' | 'skip' | 'snooze' | null;
  }>({ med: null, time: '', type: null });

  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [isCaregiverModalOpen, setIsCaregiverModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Apply dark mode & high-contrast & senior-mode to body
  useEffect(() => {
    if (userProfile.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (userProfile.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    if (userProfile.seniorMode) {
      document.body.classList.add('senior-mode');
    } else {
      document.body.classList.remove('senior-mode');
    }
  }, [userProfile.darkMode, userProfile.highContrast, userProfile.seniorMode]);

  // Online / Offline listener & Automatic Sync Queue flush
  useEffect(() => {
    const handleOnline = () => {
      const flushedCount = StorageService.flushSyncQueue();
      setSyncStatus(StorageService.getSyncStatus());
      setDoseLogs(StorageService.getDoseLogs());
      if (flushedCount > 0) {
        console.log(`Auto-synced ${flushedCount} pending items to cloud.`);
      }
    };

    const handleOffline = () => {
      setSyncStatus(StorageService.getSyncStatus());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Periodic Reminder Checker (checks every 20 seconds for scheduled dose)
  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayDateStr = now.toISOString().split('T')[0];

      medications.forEach(med => {
        if (!med.active) return;
        if (med.scheduledTimes.includes(currentTimeStr)) {
          const alreadyLogged = doseLogs.some(
            l => l.medicationId === med.id && l.scheduledDate === todayDateStr && l.scheduledTime === currentTimeStr
          );

          if (!alreadyLogged) {
            // Trigger alert chime & push notification
            if (userProfile.soundEnabled) {
              playDoseAlert();
            }
            notificationService.notifyDoseDue(med, currentTimeStr);
            if (userProfile.voiceGuidance) {
              speakText(`Reminder: It is time to take your scheduled dose of ${med.name}, ${med.dosage}.`);
            }
          }
        }
      });
    };

    const interval = setInterval(checkSchedule, 20000);
    return () => clearInterval(interval);
  }, [medications, doseLogs, userProfile.soundEnabled, userProfile.voiceGuidance]);

  // Dose Actions
  const handleTakeDose = (med: Medication, time: string, notes?: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    StorageService.logDose(med, time, todayStr, 'taken', undefined, notes);
    setDoseLogs(StorageService.getDoseLogs());
    setMedications(StorageService.getMedications());
    setSyncStatus(StorageService.getSyncStatus());
    setIsActionModalOpen(false);
  };

  const handleSkipDose = (med: Medication, time: string, reason: string, notifyCaregiver: boolean) => {
    const todayStr = new Date().toISOString().split('T')[0];
    StorageService.logDose(med, time, todayStr, 'skipped', reason);
    setDoseLogs(StorageService.getDoseLogs());
    setSyncStatus(StorageService.getSyncStatus());

    if (notifyCaregiver && userProfile.caregiver.notifyOnMissed) {
      const alertMsg = notificationService.notifyCaregiver(userProfile.caregiver, med.name, time);
      StorageService.saveCaregiverAlert(alertMsg);
    }

    setIsActionModalOpen(false);
  };

  const handleSnoozeDose = (med: Medication, time: string, minutes: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const snoozedUntil = new Date(Date.now() + minutes * 60000).toISOString();
    StorageService.logDose(med, time, todayStr, 'snoozed', undefined, undefined, snoozedUntil);
    setDoseLogs(StorageService.getDoseLogs());
    setSyncStatus(StorageService.getSyncStatus());
    setIsActionModalOpen(false);
  };

  // Medication Management
  const handleSaveMedication = (med: Medication) => {
    const all = StorageService.getMedications();
    const idx = all.findIndex(m => m.id === med.id);
    if (idx >= 0) {
      all[idx] = med;
    } else {
      all.push(med);
    }
    StorageService.saveMedications(all);
    setMedications(all);
    setSyncStatus(StorageService.getSyncStatus());
  };

  const handleDeleteMedication = (medId: string) => {
    const all = StorageService.getMedications().filter(m => m.id !== medId);
    StorageService.saveMedications(all);
    setMedications(all);
    setSyncStatus(StorageService.getSyncStatus());
  };

  const handleUpdateCaregiver = (caregiver: CaregiverContact) => {
    const updated = { ...userProfile, caregiver };
    StorageService.saveUserProfile(updated);
    setUserProfile(updated);
  };

  // Voice command handlers
  const handleVoiceTakeDose = useCallback((medNameQuery: string): boolean => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

    let targetMed = medications.find(
      m => m.name.toLowerCase().includes(medNameQuery.toLowerCase()) ||
           (m.genericName && m.genericName.toLowerCase().includes(medNameQuery.toLowerCase()))
    );

    // If no query given or generic match, pick next pending dose
    if (!targetMed && medications.length > 0) {
      targetMed = medications[0];
    }

    if (!targetMed) return false;

    // Find pending time or take first scheduled
    const time = targetMed.scheduledTimes[0] || '08:00';
    handleTakeDose(targetMed, time);
    return true;
  }, [medications]);

  const handleVoiceQueryNextDose = useCallback((): string => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

    for (const med of medications) {
      for (const time of med.scheduledTimes) {
        const [h, m] = time.split(':').map(Number);
        const itemMinutes = h * 60 + m;
        const logged = doseLogs.some(
          l => l.medicationId === med.id && l.scheduledDate === todayStr && l.scheduledTime === time && l.status === 'taken'
        );

        if (!logged && itemMinutes >= nowMinutes - 30) {
          return `Your next scheduled medication is ${med.name}, dosage ${med.dosage} at ${time}. ${med.instructions || 'Take with water.'}`;
        }
      }
    }

    return 'You have taken all scheduled medications for today. You are completely up to date!';
  }, [medications, doseLogs]);

  const handleTriggerEmergencyCaregiverAlert = () => {
    const alertMsg = notificationService.notifyCaregiver(
      userProfile.caregiver,
      'Emergency Check-In / Patient Assistance Request',
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    StorageService.saveCaregiverAlert(alertMsg);
  };

  // Quick Toggles
  const toggleSeniorMode = () => {
    const updated = { ...userProfile, seniorMode: !userProfile.seniorMode };
    StorageService.saveUserProfile(updated);
    setUserProfile(updated);
  };

  const toggleHighContrast = () => {
    const updated = { ...userProfile, highContrast: !userProfile.highContrast };
    StorageService.saveUserProfile(updated);
    setUserProfile(updated);
  };

  const toggleDarkMode = () => {
    const updated = { ...userProfile, darkMode: !userProfile.darkMode };
    StorageService.saveUserProfile(updated);
    setUserProfile(updated);
  };

  const toggleSound = () => {
    const updated = { ...userProfile, soundEnabled: !userProfile.soundEnabled };
    StorageService.saveUserProfile(updated);
    setUserProfile(updated);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors selection:bg-emerald-500 selection:text-white">
      
      {/* Biometric & PIN Security Lock Screen */}
      <BiometricAuthModal
        userProfile={userProfile}
        isOpen={isLocked}
        onSuccess={() => setIsLocked(false)}
      />

      {/* Main Accessible Header */}
      <Navbar
        userProfile={userProfile}
        syncStatus={syncStatus}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenNewMedModal={() => {
          setEditingMedication(null);
          setIsMedModalOpen(true);
        }}
        onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
        onLockApp={() => setIsLocked(true)}
        onToggleSeniorMode={toggleSeniorMode}
        onToggleHighContrast={toggleHighContrast}
        onToggleDarkMode={toggleDarkMode}
        onToggleSound={toggleSound}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {userProfile.seniorMode ? (
          <SeniorModeDashboard
            userProfile={userProfile}
            medications={medications}
            todayLogs={doseLogs.filter(l => l.scheduledDate === new Date().toISOString().split('T')[0])}
            onTakeDose={handleTakeDose}
            onSnoozeDose={handleSnoozeDose}
            onCallCaregiver={() => setIsCaregiverModalOpen(true)}
            onExitSeniorMode={toggleSeniorMode}
          />
        ) : (
          <>
            {currentTab === 'schedule' && (
              <StandardDashboard
                userProfile={userProfile}
                medications={medications}
                doseLogs={doseLogs}
                onTakeDose={handleTakeDose}
                onOpenActionModal={(med, time, type) => {
                  setActionParams({ med, time, type });
                  setIsActionModalOpen(true);
                }}
                onEditMedication={(med) => {
                  setEditingMedication(med);
                  setIsMedModalOpen(true);
                }}
                onOpenNewMedModal={() => {
                  setEditingMedication(null);
                  setIsMedModalOpen(true);
                }}
                onOpenCaregiverModal={() => setIsCaregiverModalOpen(true)}
              />
            )}

            {currentTab === 'history' && (
              <HistoryCalendar
                doseLogs={doseLogs}
                medications={medications}
                userProfile={userProfile}
              />
            )}

            {currentTab === 'caregiver' && (
              <div className="max-w-4xl mx-auto px-4 py-8">
                <CaregiverAlertsModal
                  isOpen={true}
                  userProfile={userProfile}
                  onClose={() => setCurrentTab('schedule')}
                  onUpdateCaregiver={handleUpdateCaregiver}
                />
              </div>
            )}

            {currentTab === 'backup' && (
              <div className="max-w-4xl mx-auto px-4 py-8">
                <BackupModal
                  isOpen={true}
                  userProfile={userProfile}
                  syncStatus={syncStatus}
                  onClose={() => setCurrentTab('schedule')}
                  onDataRestored={() => {
                    setMedications(StorageService.getMedications());
                    setDoseLogs(StorageService.getDoseLogs());
                    setUserProfile(StorageService.getUserProfile());
                  }}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Hands-Free Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
        onTakeDoseByName={handleVoiceTakeDose}
        onQueryNextDose={handleVoiceQueryNextDose}
        onToggleSeniorMode={toggleSeniorMode}
        onToggleHighContrast={toggleHighContrast}
        onNavigateTab={(tab) => {
          setCurrentTab(tab);
          setIsVoiceAssistantOpen(false);
        }}
        onTriggerCaregiverAlert={handleTriggerEmergencyCaregiverAlert}
      />

      {/* Medication Create / Edit Modal */}
      <MedicationModal
        isOpen={isMedModalOpen}
        onClose={() => {
          setIsMedModalOpen(false);
          setEditingMedication(null);
        }}
        onSave={handleSaveMedication}
        onDelete={handleDeleteMedication}
        editingMedication={editingMedication}
      />

      {/* Dose Action (Take/Skip/Snooze) Modal */}
      <DoseActionModal
        isOpen={isActionModalOpen}
        actionType={actionParams.type}
        medication={actionParams.med}
        scheduledTime={actionParams.time}
        onClose={() => setIsActionModalOpen(false)}
        onConfirmTake={handleTakeDose}
        onConfirmSkip={handleSkipDose}
        onConfirmSnooze={handleSnoozeDose}
      />

      {/* Caregiver Alerts Modal */}
      {currentTab !== 'caregiver' && (
        <CaregiverAlertsModal
          isOpen={isCaregiverModalOpen}
          userProfile={userProfile}
          onClose={() => setIsCaregiverModalOpen(false)}
          onUpdateCaregiver={handleUpdateCaregiver}
        />
      )}

      {/* Cloud Backup Modal */}
      {currentTab !== 'backup' && (
        <BackupModal
          isOpen={isBackupModalOpen}
          userProfile={userProfile}
          syncStatus={syncStatus}
          onClose={() => setIsBackupModalOpen(false)}
          onDataRestored={() => {
            setMedications(StorageService.getMedications());
            setDoseLogs(StorageService.getDoseLogs());
            setUserProfile(StorageService.getUserProfile());
          }}
        />
      )}

    </div>
  );
}
