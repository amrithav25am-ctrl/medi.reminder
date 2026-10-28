import React from 'react';
import { 
  Pill, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  Mic, 
  Volume2, 
  VolumeX, 
  Eye, 
  Lock, 
  Users, 
  Moon, 
  Sun,
  Database,
  Calendar,
  Plus
} from 'lucide-react';
import { UserProfile, SyncStatus } from '../types';

interface NavbarProps {
  userProfile: UserProfile;
  syncStatus: SyncStatus;
  currentTab: 'schedule' | 'history' | 'caregiver' | 'backup';
  onTabChange: (tab: 'schedule' | 'history' | 'caregiver' | 'backup') => void;
  onOpenNewMedModal: () => void;
  onOpenVoiceAssistant: () => void;
  onLockApp: () => void;
  onToggleSeniorMode: () => void;
  onToggleHighContrast: () => void;
  onToggleDarkMode: () => void;
  onToggleSound: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userProfile,
  syncStatus,
  currentTab,
  onTabChange,
  onOpenNewMedModal,
  onOpenVoiceAssistant,
  onLockApp,
  onToggleSeniorMode,
  onToggleHighContrast,
  onToggleDarkMode,
  onToggleSound,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 hc-card backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          
          {/* Logo & Patient Identity */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 hc-btn-primary">
              <Pill className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-zinc-900 dark:text-zinc-50 hc-text-primary">
                  DoseMate
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hc-badge">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  E2EE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium truncate max-w-[150px] sm:max-w-xs">
                Patient: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{userProfile.name}</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => onTabChange('schedule')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                currentTab === 'schedule'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 hc-btn-primary'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Pill className="w-4 h-4" />
              <span>Today's Schedule</span>
            </button>

            <button
              onClick={() => onTabChange('history')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                currentTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 hc-btn-primary'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Adherence & History</span>
            </button>

            <button
              onClick={() => onTabChange('caregiver')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                currentTab === 'caregiver'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 hc-btn-primary'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Caregiver Alerts</span>
            </button>

            <button
              onClick={() => onTabChange('backup')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                currentTab === 'backup'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 hc-btn-primary'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Cloud & E2EE</span>
            </button>
          </nav>

          {/* Action Bar & Accessibility Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Sync / Offline Status Pill */}
            <div 
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                syncStatus.isOnline
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}
              title={syncStatus.isOnline ? 'Online - Synced to cloud' : `${syncStatus.pendingSyncCount} local changes queued for sync`}
            >
              {syncStatus.isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cloud Synced</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>Offline ({syncStatus.pendingSyncCount} queued)</span>
                </>
              )}
            </div>

            {/* Voice Command Button */}
            <button
              onClick={onOpenVoiceAssistant}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900 border border-violet-200 dark:border-violet-800 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs"
              title="Voice Commands: Speak to log medication, ask what is next, etc."
              aria-label="Activate Voice Assistant"
            >
              <Mic className="w-4 h-4 text-violet-600 dark:text-violet-400 animate-bounce" />
              <span className="hidden sm:inline">Voice Control</span>
            </button>

            {/* Senior Mode Toggle */}
            <button
              onClick={onToggleSeniorMode}
              className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center gap-1.5 ${
                userProfile.seniorMode
                  ? 'bg-amber-400 text-zinc-950 border-amber-500 shadow-sm ring-2 ring-amber-400/30 hc-btn-primary'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200'
              }`}
              title="Senior Mode: Extra large buttons, audio narration, and simplified layout"
            >
              <span className="text-base">👵</span>
              <span className="hidden sm:inline">{userProfile.seniorMode ? 'Senior Mode ON' : 'Senior Mode'}</span>
            </button>

            {/* High Contrast Mode Toggle */}
            <button
              onClick={onToggleHighContrast}
              className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                userProfile.highContrast
                  ? 'bg-yellow-400 text-black border-yellow-500 ring-2 ring-yellow-400'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
              }`}
              title="Toggle High-Contrast Mode for low vision"
              aria-label="Toggle High-Contrast Mode"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
              title={userProfile.soundEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
              aria-label="Toggle Sound Alerts"
            >
              {userProfile.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-400" />
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
              title="Toggle Dark Mode"
              aria-label="Toggle Dark Mode"
            >
              {userProfile.darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-600" />
              )}
            </button>

            {/* Add Medication Button */}
            <button
              onClick={onOpenNewMedModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-emerald-600/30 transition-all hc-btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Add Med</span>
            </button>

            {/* Lock Screen / Biometric Button */}
            <button
              onClick={onLockApp}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 transition-all"
              title="Lock with Biometrics / PIN"
              aria-label="Lock application"
            >
              <Lock className="w-4 h-4 text-amber-600" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={() => onTabChange('schedule')}
            className={`flex flex-col items-center py-1 px-3 text-xs font-semibold rounded-lg ${
              currentTab === 'schedule' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500'
            }`}
          >
            <Pill className="w-4 h-4 mb-0.5" />
            <span>Schedule</span>
          </button>
          <button
            onClick={() => onTabChange('history')}
            className={`flex flex-col items-center py-1 px-3 text-xs font-semibold rounded-lg ${
              currentTab === 'history' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500'
            }`}
          >
            <Calendar className="w-4 h-4 mb-0.5" />
            <span>History</span>
          </button>
          <button
            onClick={() => onTabChange('caregiver')}
            className={`flex flex-col items-center py-1 px-3 text-xs font-semibold rounded-lg ${
              currentTab === 'caregiver' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500'
            }`}
          >
            <Users className="w-4 h-4 mb-0.5" />
            <span>Caregiver</span>
          </button>
          <button
            onClick={() => onTabChange('backup')}
            className={`flex flex-col items-center py-1 px-3 text-xs font-semibold rounded-lg ${
              currentTab === 'backup' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-zinc-500'
            }`}
          >
            <Database className="w-4 h-4 mb-0.5" />
            <span>Cloud</span>
          </button>
          <button
            onClick={onOpenNewMedModal}
            className="flex flex-col items-center py-1 px-3 text-xs font-semibold rounded-lg text-emerald-600"
          >
            <Plus className="w-4 h-4 mb-0.5" />
            <span>Add</span>
          </button>
        </div>

      </div>
    </header>
  );
};
