import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Volume2, 
  PhoneCall, 
  AlertTriangle, 
  ShieldAlert, 
  Check, 
  Calendar,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Medication, DoseLog, UserProfile } from '../types';
import { playSuccessChime, playDoseAlert, speakText } from '../services/soundService';

interface SeniorModeDashboardProps {
  userProfile: UserProfile;
  medications: Medication[];
  todayLogs: DoseLog[];
  onTakeDose: (med: Medication, time: string) => void;
  onSnoozeDose: (med: Medication, time: string, minutes: number) => void;
  onCallCaregiver: () => void;
  onExitSeniorMode: () => void;
}

export const SeniorModeDashboard: React.FC<SeniorModeDashboardProps> = ({
  userProfile,
  medications,
  todayLogs,
  onTakeDose,
  onSnoozeDose,
  onCallCaregiver,
  onExitSeniorMode,
}) => {
  // Find current or next pending dose
  const currentTime = new Date();
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  interface ScheduledItem {
    med: Medication;
    time: string;
    minutes: number;
    log?: DoseLog;
  }

  const allTodayItems: ScheduledItem[] = [];
  medications.forEach(med => {
    if (!med.active) return;
    med.scheduledTimes.forEach(time => {
      const [h, m] = time.split(':').map(Number);
      const minutes = h * 60 + m;
      const log = todayLogs.find(l => l.medicationId === med.id && l.scheduledTime === time);
      allTodayItems.push({ med, time, minutes, log });
    });
  });

  allTodayItems.sort((a, b) => a.minutes - b.minutes);

  // Find next pending or overdue item
  const nextPendingItem = allTodayItems.find(item => !item.log || item.log.status === 'pending' || item.log.status === 'snoozed');

  const handleTakeNext = () => {
    if (!nextPendingItem) return;
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    playSuccessChime();
    onTakeDose(nextPendingItem.med, nextPendingItem.time);
    speakText(`Wonderful! You took your ${nextPendingItem.med.name}.`);
  };

  const handleReadAloud = () => {
    if (!nextPendingItem) {
      speakText('All your scheduled medicines for today have been taken! Great job.');
      return;
    }
    const text = `Next medicine is ${nextPendingItem.med.name}, dosage ${nextPendingItem.med.dosage}. Scheduled for ${nextPendingItem.time}. Instruction: ${nextPendingItem.med.instructions || 'Take with water.'}`;
    speakText(text);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Banner Notice */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-400 dark:border-amber-600 rounded-3xl hc-card">
        <div className="flex items-center gap-3">
          <span className="text-3xl">👵</span>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50 hc-text-primary">
              Senior Simple View
            </h2>
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Large buttons, clear voice assistance, and instant caregiver alerts.
            </p>
          </div>
        </div>
        <button
          onClick={onExitSeniorMode}
          className="mt-3 sm:mt-0 px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold rounded-2xl text-sm hover:opacity-90 transition-all hc-btn-primary"
        >
          Exit to Full Dashboard
        </button>
      </div>

      {/* Hero: Active / Next Dose Card */}
      {nextPendingItem ? (
        <div className="bg-white dark:bg-zinc-900 border-4 border-emerald-500 dark:border-emerald-400 rounded-3xl p-6 sm:p-8 shadow-xl hc-card relative overflow-hidden">
          
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <span className="px-4 py-1.5 rounded-full text-sm font-black bg-emerald-600 text-white tracking-wide uppercase">
              Medicine to Take Now
            </span>
            <div className="flex items-center gap-2 text-xl font-black text-zinc-900 dark:text-zinc-100">
              <Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <span>Scheduled for {nextPendingItem.time}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 my-6">
            {/* Large Pill Visualizer */}
            <div 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center shadow-md border-2 border-white/40 shrink-0"
              style={{ backgroundColor: nextPendingItem.med.color }}
            >
              <span className="text-3xl sm:text-4xl">💊</span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-50 hc-text-primary">
                {nextPendingItem.med.name}
              </h1>
              <p className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                Amount: {nextPendingItem.med.dosage}
              </p>
              <p className="text-base sm:text-lg font-semibold text-zinc-700 dark:text-zinc-300 mt-2 bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl">
                ⚠️ {nextPendingItem.med.instructions || 'Take with a full glass of water.'}
              </p>
            </div>
          </div>

          {/* Huge Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <button
              onClick={handleTakeNext}
              className="min-h-[70px] w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xl sm:text-2xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/30 transition-all hc-btn-success"
            >
              <CheckCircle2 className="w-8 h-8" />
              <span>YES, I TOOK THIS</span>
            </button>

            <button
              onClick={handleReadAloud}
              className="min-h-[70px] w-full rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-black text-xl sm:text-2xl flex items-center justify-center gap-3 shadow-lg shadow-sky-600/30 transition-all hc-btn-primary"
            >
              <Volume2 className="w-8 h-8" />
              <span>READ TO ME</span>
            </button>

            <button
              onClick={() => onSnoozeDose(nextPendingItem.med, nextPendingItem.time, 15)}
              className="min-h-[64px] w-full rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-extrabold text-lg sm:text-xl flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Clock className="w-6 h-6" />
              <span>Remind Me in 15 Min</span>
            </button>

            <button
              onClick={onCallCaregiver}
              className="min-h-[64px] w-full rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-extrabold text-lg sm:text-xl flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <PhoneCall className="w-6 h-6" />
              <span>Call Emily ({userProfile.caregiver.relationship})</span>
            </button>
          </div>

        </div>
      ) : (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border-4 border-emerald-500 rounded-3xl p-8 text-center hc-card">
          <div className="inline-flex p-4 rounded-full bg-emerald-600 text-white mb-4">
            <CheckCircle2 className="w-16 h-16" />
          </div>
          <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 hc-text-primary">
            All Caught Up for Today!
          </h2>
          <p className="text-lg font-semibold text-zinc-600 dark:text-zinc-300 mt-2 max-w-md mx-auto">
            You have successfully taken all scheduled medicines. Rest easy, Eleanor!
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={onCallCaregiver}
              className="min-h-[56px] px-6 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold text-lg flex items-center gap-2"
            >
              <PhoneCall className="w-5 h-5" />
              <span>Call Caregiver</span>
            </button>
          </div>
        </div>
      )}

      {/* Simple Checklist of Today's Medicines */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 hc-card">
        <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2 hc-text-primary">
          <Calendar className="w-7 h-7 text-emerald-600" />
          <span>Today's Medicine Checklist</span>
        </h3>

        <div className="space-y-3">
          {allTodayItems.map((item, idx) => {
            const isTaken = item.log?.status === 'taken';
            const isSkipped = item.log?.status === 'skipped';
            return (
              <div
                key={`${item.med.id}-${item.time}-${idx}`}
                className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                  isTaken
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700'
                    : isSkipped
                    ? 'bg-zinc-100 dark:bg-zinc-800/60 border-zinc-300 dark:border-zinc-700 opacity-60'
                    : 'bg-white dark:bg-zinc-850 border-zinc-300 dark:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                    style={{ backgroundColor: item.med.color }}
                  >
                    💊
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {item.med.name}
                    </h4>
                    <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                      {item.med.dosage} • Time: <span className="font-bold text-zinc-800 dark:text-zinc-200">{item.time}</span>
                    </p>
                  </div>
                </div>

                {isTaken ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 text-white font-bold text-sm">
                    <Check className="w-5 h-5" />
                    <span>Done</span>
                  </span>
                ) : isSkipped ? (
                  <span className="px-3 py-1.5 rounded-full bg-zinc-400 text-white font-bold text-sm">
                    Skipped
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      playSuccessChime();
                      onTakeDose(item.med, item.time);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md"
                  >
                    Take Now
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
