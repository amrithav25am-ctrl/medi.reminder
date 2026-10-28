import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Phone, 
  Mail, 
  BellRing, 
  ShieldAlert, 
  CheckCircle2, 
  Send, 
  Clock, 
  HeartHandshake,
  AlertTriangle
} from 'lucide-react';
import { CaregiverContact, CaregiverAlertMessage, UserProfile } from '../types';
import { notificationService } from '../services/notificationService';
import { StorageService } from '../services/storageService';
import { playSuccessChime, playWarningTone } from '../services/soundService';

interface CaregiverAlertsModalProps {
  isOpen: boolean;
  userProfile: UserProfile;
  onClose: () => void;
  onUpdateCaregiver: (caregiver: CaregiverContact) => void;
}

export const CaregiverAlertsModal: React.FC<CaregiverAlertsModalProps> = ({
  isOpen,
  userProfile,
  onClose,
  onUpdateCaregiver,
}) => {
  const [caregiver, setCaregiver] = useState<CaregiverContact>(userProfile.caregiver);
  const [alerts, setAlerts] = useState<CaregiverAlertMessage[]>(StorageService.getCaregiverAlerts());
  const [testSent, setTestSent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCaregiver(caregiver);
    setSaveSuccess(true);
    playSuccessChime();
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSendTestAlert = () => {
    playWarningTone();
    const testMsg = notificationService.notifyCaregiver(
      caregiver,
      'Test Alert: Lisinopril',
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    StorageService.saveCaregiverAlert(testMsg);
    setAlerts(StorageService.getCaregiverAlerts());
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl hc-card my-8 relative">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 hc-text-primary">
                Family & Caregiver Alert System
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Enhance accountability and coordinate care for seniors
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

        {/* Feature Overview Card */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 mb-6 flex items-start gap-3">
          <HeartHandshake className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 dark:text-emerald-200">
            <p className="font-bold">Peace of Mind for Families</p>
            <p className="mt-0.5">
              If a dose is missed past your threshold, DoseMate automatically dispatches an SMS/Email alert to your nominated caregiver so they can check in gently.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Caregiver Name & Relationship */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Caregiver / Family Name *
              </label>
              <input
                type="text"
                required
                value={caregiver.name}
                onChange={e => setCaregiver({ ...caregiver, name: e.target.value })}
                placeholder="e.g. Emily Davis"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Relationship
              </label>
              <input
                type="text"
                value={caregiver.relationship}
                onChange={e => setCaregiver({ ...caregiver, relationship: e.target.value })}
                placeholder="e.g. Daughter, Spouse, Visiting Nurse"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-zinc-500" />
                <span>Mobile Phone (for SMS Alerts) *</span>
              </label>
              <input
                type="tel"
                required
                value={caregiver.phone}
                onChange={e => setCaregiver({ ...caregiver, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                value={caregiver.email}
                onChange={e => setCaregiver({ ...caregiver, email: e.target.value })}
                placeholder="caregiver@family.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Alert Threshold & Triggers */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={caregiver.notifyOnMissed}
                onChange={e => setCaregiver({ ...caregiver, notifyOnMissed: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300"
              />
              <span className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
                Automatically send alert if medication is missed
              </span>
            </label>

            {caregiver.notifyOnMissed && (
              <div className="pl-7">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Wait before alerting caregiver:
                </label>
                <div className="flex gap-2">
                  {[15, 30, 60].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setCaregiver({ ...caregiver, notifyThresholdMinutes: mins })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        caregiver.notifyThresholdMinutes === mins
                          ? 'border-emerald-500 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {mins} mins overdue
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleSendTestAlert}
              disabled={testSent}
              className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Send className="w-4 h-4 text-rose-500" />
              <span>{testSent ? '✓ Test Alert Dispatched!' : 'Send Test Alert to Caregiver'}</span>
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 hc-btn-primary transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saveSuccess ? 'Saved!' : 'Save Caregiver Info'}</span>
            </button>
          </div>

        </form>

        {/* Recent Dispatches Log */}
        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Recent Caregiver Notification Log</span>
          </h4>

          {alerts.length === 0 ? (
            <p className="text-xs text-zinc-500 italic">No alerts have been dispatched yet.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {alerts.map(a => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-xs flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">
                        {a.recipientPhone} ({a.caregiverName})
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        {a.status}
                      </span>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2">
                      {a.messageText}
                    </p>
                  </div>
                  <span className="text-[10px] text-zinc-400 shrink-0">
                    {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
