import React, { useState } from 'react';
import { X, CheckCircle2, Clock, AlertCircle, Ban, MessageSquare } from 'lucide-react';
import { Medication } from '../types';

interface DoseActionModalProps {
  isOpen: boolean;
  actionType: 'take' | 'skip' | 'snooze' | null;
  medication: Medication | null;
  scheduledTime: string;
  onClose: () => void;
  onConfirmTake: (med: Medication, time: string, notes?: string) => void;
  onConfirmSkip: (med: Medication, time: string, reason: string, notifyCaregiver: boolean) => void;
  onConfirmSnooze: (med: Medication, time: string, minutes: number) => void;
}

const COMMON_SKIP_REASONS = [
  'Feeling nauseous or upset stomach',
  'Doctor instructed to hold/pause dose',
  'Ran out of medication / awaiting refill',
  'Already took earlier by mistake',
  'Away from home / forgot pills',
  'Experiencing mild side effects',
];

export const DoseActionModal: React.FC<DoseActionModalProps> = ({
  isOpen,
  actionType,
  medication,
  scheduledTime,
  onClose,
  onConfirmTake,
  onConfirmSkip,
  onConfirmSnooze,
}) => {
  const [skipReason, setSkipReason] = useState(COMMON_SKIP_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [notifyCaregiver, setNotifyCaregiver] = useState(true);
  const [notes, setNotes] = useState('');
  const [snoozeMinutes, setSnoozeMinutes] = useState(15);

  if (!isOpen || !medication || !actionType) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl hc-card animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-xl shadow-xs"
              style={{ backgroundColor: medication.color }}
            >
              💊
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 hc-text-primary">
                {medication.name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {medication.dosage} • Scheduled for {scheduledTime}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on action type */}
        {actionType === 'take' && (
          <div className="py-4 space-y-4">
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  Ready to mark as taken?
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Remaining inventory will be updated ({medication.remainingPills} → {Math.max(0, medication.remainingPills - 1)} pills).
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Optional note (e.g. taken with food or water):
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Taken with breakfast"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-emerald-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirmTake(medication, scheduledTime, notes)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/30 hc-btn-primary"
              >
                Confirm Dose Taken
              </button>
            </div>
          </div>
        )}

        {actionType === 'skip' && (
          <div className="py-4 space-y-4">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
              <Ban className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-900 dark:text-amber-200 font-medium">
                Logging the reason helps your doctor and caregiver understand missed doses.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                Reason for skipping this dose:
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {COMMON_SKIP_REASONS.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSkipReason(r);
                      setCustomReason('');
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      skipReason === r && !customReason
                        ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Or other specific reason:
              </label>
              <input
                type="text"
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="Type your reason..."
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={notifyCaregiver}
                onChange={e => setNotifyCaregiver(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-zinc-300"
              />
              <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                Send alert to family caregiver regarding this skip
              </span>
            </label>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirmSkip(medication, scheduledTime, customReason || skipReason, notifyCaregiver)}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md"
              >
                Record Skipped Dose
              </button>
            </div>
          </div>
        )}

        {actionType === 'snooze' && (
          <div className="py-4 space-y-4">
            <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center gap-3">
              <Clock className="w-5 h-5 text-sky-600 shrink-0" />
              <p className="text-xs text-sky-900 dark:text-sky-200 font-medium">
                Delay the notification so you don't forget to take it later.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                Snooze duration:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[15, 30, 60].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSnoozeMinutes(mins)}
                    className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                      snoozeMinutes === mins
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 ring-2 ring-sky-400'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    {mins} Minutes
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirmSnooze(medication, scheduledTime, snoozeMinutes)}
                className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md"
              >
                Snooze for {snoozeMinutes}m
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
