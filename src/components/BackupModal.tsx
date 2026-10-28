import React, { useState } from 'react';
import { 
  X, 
  Database, 
  ShieldCheck, 
  Download, 
  Upload, 
  RefreshCw, 
  Lock, 
  Key, 
  CheckCircle2, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { UserProfile, SyncStatus } from '../types';
import { StorageService } from '../services/storageService';
import { playSuccessChime, playWarningTone } from '../services/soundService';

interface BackupModalProps {
  isOpen: boolean;
  userProfile: UserProfile;
  syncStatus: SyncStatus;
  onClose: () => void;
  onDataRestored: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  userProfile,
  syncStatus,
  onClose,
  onDataRestored,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [ciphertextPreview, setCiphertextPreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateEncryptedBackup = async () => {
    setIsExporting(true);
    setStatusMessage('Generating 256-bit AES-GCM encrypted snapshot...');

    try {
      const encryptedJson = await StorageService.exportEncryptedBackup();
      setCiphertextPreview(encryptedJson);

      // Trigger file download
      const blob = new Blob([encryptedJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DoseMate_Encrypted_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      playSuccessChime();
      setStatusMessage('✓ Encrypted backup created and downloaded successfully!');
    } catch (e) {
      console.error(e);
      playWarningTone();
      setStatusMessage('Failed to create backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    setStatusMessage('Decrypting and verifying backup integrity...');

    try {
      const text = await file.text();
      const success = await StorageService.restoreEncryptedBackup(text);
      if (success) {
        playSuccessChime();
        setStatusMessage('✓ Backup successfully restored and decrypted!');
        onDataRestored();
      } else {
        playWarningTone();
        setStatusMessage('Decryption failed. Invalid format or corruption.');
      }
    } catch (err) {
      console.error(err);
      playWarningTone();
      setStatusMessage('Error parsing backup file.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleManualSync = () => {
    const count = StorageService.flushSyncQueue();
    playSuccessChime();
    setStatusMessage(`✓ Synced ${count} offline updates to cloud store.`);
    onDataRestored();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl hc-card my-8 relative">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 hc-text-primary">
                Cloud Backup & E2E Encryption
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                AES-GCM 256-bit zero-knowledge health data protection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Shield Banner */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 mb-6 flex items-start gap-3.5">
          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
              End-to-End Encryption (E2EE) Active
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
              Your prescription medications, dosage logs, and caregiver contacts are encrypted on your device using Web Crypto AES-GCM before syncing or exporting. Only your authenticated session can read them.
            </p>
          </div>
        </div>

        {/* Cloud Sync Status */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Network & Cloud Sync State
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              syncStatus.isOnline 
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200' 
                : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${syncStatus.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {syncStatus.isOnline ? 'Connected (Auto-Syncing)' : 'Offline Mode (Local Storage)'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
            <span>Pending Offline Changes:</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              {syncStatus.pendingSyncCount} operations queued
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
            <span>Last Cloud Check:</span>
            <span className="font-medium">
              {syncStatus.lastSyncedAt ? new Date(syncStatus.lastSyncedAt).toLocaleTimeString() : 'Just now'}
            </span>
          </div>

          <button
            onClick={handleManualSync}
            className="w-full mt-2 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Force Immediate Cloud Sync</span>
          </button>
        </div>

        {/* Export & Import Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleCreateEncryptedBackup}
            disabled={isExporting}
            className="p-4 rounded-2xl border-2 border-emerald-500/50 hover:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-left transition-all group"
          >
            <Download className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Export Encrypted Vault
            </h4>
            <p className="text-xs text-zinc-500 mt-1">
              Download complete medicine schedule and history encrypted in .json format.
            </p>
          </button>

          <label className="p-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 text-left transition-all cursor-pointer group block">
            <Upload className="w-5 h-5 text-zinc-600 dark:text-zinc-300 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Restore from Backup
            </h4>
            <p className="text-xs text-zinc-500 mt-1">
              Upload an encrypted backup to restore schedules across devices.
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {statusMessage && (
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 text-center mb-4 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Live Ciphertext Inspector */}
        {ciphertextPreview && (
          <div className="mt-4 p-4 rounded-2xl bg-zinc-950 text-zinc-300 border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                Live AES-GCM Encrypted Output
              </span>
              <span className="text-[10px] text-zinc-500">Zero-Knowledge Ciphertext</span>
            </div>
            <pre className="text-[10px] font-mono overflow-x-auto max-h-32 text-zinc-400 p-2 bg-black/50 rounded-lg">
              {ciphertextPreview}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
};
