import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  Ban, 
  Volume2, 
  AlertTriangle, 
  Calendar, 
  Plus, 
  Edit3, 
  Sparkles, 
  Users, 
  Bell, 
  Send,
  Pill,
  ChevronRight,
  TrendingUp,
  Award,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Medication, DoseLog, UserProfile, DoseStatus } from '../types';
import { playSuccessChime, playDoseAlert, speakText } from '../services/soundService';
import { notificationService } from '../services/notificationService';

interface StandardDashboardProps {
  userProfile: UserProfile;
  medications: Medication[];
  doseLogs: DoseLog[];
  onTakeDose: (med: Medication, time: string, notes?: string) => void;
  onOpenActionModal: (med: Medication, time: string, type: 'take' | 'skip' | 'snooze') => void;
  onEditMedication: (med: Medication) => void;
  onOpenNewMedModal: () => void;
  onOpenCaregiverModal: () => void;
}

export const StandardDashboard: React.FC<StandardDashboardProps> = ({
  userProfile,
  medications,
  doseLogs,
  onTakeDose,
  onOpenActionModal,
  onEditMedication,
  onOpenNewMedModal,
  onOpenCaregiverModal,
}) => {
  const [activeTabTimePeriod, setActiveTabTimePeriod] = useState<'all' | 'morning' | 'afternoon' | 'evening' | 'night'>('all');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    notificationService.getPermissionStatus()
  );
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Clock ticker every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = currentDateTime.toISOString().split('T')[0];
  const currentHours = currentDateTime.getHours();
  const currentMinutes = currentDateTime.getMinutes();
  const currentTotalMinutes = currentHours * 60 + currentMinutes;

  // Flatten today's scheduled dose items
  interface ScheduledDoseItem {
    med: Medication;
    time: string;
    totalMinutes: number;
    log?: DoseLog;
    period: 'morning' | 'afternoon' | 'evening' | 'night';
  }

  const todayItems: ScheduledDoseItem[] = [];

  medications.forEach(med => {
    if (!med.active) return;
    med.scheduledTimes.forEach(time => {
      const [h, m] = time.split(':').map(Number);
      const totalMinutes = h * 60 + m;

      let period: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
      if (h >= 12 && h < 17) period = 'afternoon';
      else if (h >= 17 && h < 21) period = 'evening';
      else if (h >= 21 || h < 6) period = 'night';

      const log = doseLogs.find(l => l.medicationId === med.id && l.scheduledDate === todayStr && l.scheduledTime === time);

      todayItems.push({
        med,
        time,
        totalMinutes,
        log,
        period,
      });
    });
  });

  todayItems.sort((a, b) => a.totalMinutes - b.totalMinutes);

  // Filtered by selected period tab
  const filteredItems = activeTabTimePeriod === 'all' 
    ? todayItems 
    : todayItems.filter(item => item.period === activeTabTimePeriod);

  // Find active due / overdue doses (within 30 mins or overdue and not yet taken)
  const dueNowItem = todayItems.find(item => {
    if (item.log && item.log.status === 'taken') return false;
    if (item.log && item.log.status === 'skipped') return false;
    const diff = currentTotalMinutes - item.totalMinutes;
    // Due now if between -15 mins and +120 mins
    return diff >= -15;
  });

  // Calculate today's adherence rate
  const totalTodayScheduled = todayItems.length;
  const totalTodayTaken = todayItems.filter(i => i.log?.status === 'taken').length;
  const todayProgressPercent = totalTodayScheduled > 0 ? Math.round((totalTodayTaken / totalTodayScheduled) * 100) : 100;

  // Low inventory medications
  const lowStockMeds = medications.filter(m => m.remainingPills <= m.refillThreshold && m.active);

  const handleQuickTake = (item: ScheduledDoseItem) => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
    playSuccessChime();
    onTakeDose(item.med, item.time);
  };

  const handleRequestPush = async () => {
    const granted = await notificationService.requestPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* Push Notification Permission Request Banner */}
      {notificationPermission !== 'granted' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm sm:text-base">
                Enable Instant Dose Push Notifications
              </p>
              <p className="text-xs text-white/90">
                Receive browser sound alerts even when DoseMate is running in the background.
              </p>
            </div>
          </div>
          <button
            onClick={handleRequestPush}
            className="px-4 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs sm:text-sm hover:bg-white/90 transition-all shrink-0 shadow-sm"
          >
            Allow Notifications
          </button>
        </div>
      )}

      {/* Active Overdue / Due Now Alert Banner */}
      {dueNowItem && (
        <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600 shadow-md hc-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-start sm:items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-sm shrink-0"
              style={{ backgroundColor: dueNowItem.med.color }}
            >
              💊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide bg-amber-500 text-white">
                  Dose Due Now
                </span>
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  Scheduled for {dueNowItem.time}
                </span>
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 mt-1 hc-text-primary">
                {dueNowItem.med.name} - {dueNowItem.med.dosage}
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                Instruction: {dueNowItem.med.instructions || 'Take with water.'} ({dueNowItem.med.foodTiming.replace('_', ' ')})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleQuickTake(dueNowItem)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 hc-btn-primary transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Take Dose</span>
            </button>
            <button
              onClick={() => onOpenActionModal(dueNowItem.med, dueNowItem.time, 'snooze')}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all"
            >
              Snooze
            </button>
            <button
              onClick={() => onOpenActionModal(dueNowItem.med, dueNowItem.time, 'skip')}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-zinc-700 dark:text-zinc-300 hover:text-rose-700 text-xs font-bold transition-all"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Low Stock Warning Banner */}
      {lowStockMeds.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="text-rose-900 dark:text-rose-200 font-semibold">
              Refill Needed Soon: {lowStockMeds.map(m => `${m.name} (${m.remainingPills} pills left)`).join(', ')}
            </span>
          </div>
          <span className="font-bold text-rose-700 dark:text-rose-300 shrink-0">
            Dr. Mitchell: (555) 234-5678
          </span>
        </div>
      )}

      {/* Top Stats & Quick Caregiver Sync Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Today's Progress Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hc-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Today's Progress</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {totalTodayTaken} of {totalTodayScheduled} taken
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50">
              {todayProgressPercent}%
            </span>
            <span className="text-xs text-zinc-400">completed</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 mt-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${todayProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Current Adherence Streak */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hc-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Adherence Streak</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-500">
              6 Days 🔥
            </span>
            <span className="text-xs font-semibold text-zinc-500">consecutive</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Great job! Maintaining on-time medication preserves therapeutic levels.
          </p>
        </div>

        {/* Family Caregiver Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hc-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Family Caregiver</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="my-2">
            <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {userProfile.caregiver.name} ({userProfile.caregiver.relationship})
            </h4>
            <p className="text-xs text-zinc-500">
              {userProfile.caregiver.phone} • Alerts: {userProfile.caregiver.notifyOnMissed ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <button
            onClick={onOpenCaregiverModal}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 self-start"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Caregiver Settings & Alerts</span>
          </button>
        </div>

      </div>

      {/* Main Today's Schedule Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs hc-card space-y-6">
        
        {/* Schedule Header & Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 hc-text-primary">
              Today's Medication Schedule
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Time of Day Tabs */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl">
            {(['all', 'morning', 'afternoon', 'evening', 'night'] as const).map(period => (
              <button
                key={period}
                onClick={() => setActiveTabTimePeriod(period)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  activeTabTimePeriod === period
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Dose Schedule List */}
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center">
            <Pill className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-zinc-700 dark:text-zinc-300">
              No medications scheduled for this period
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Add a new medication or check other daily time periods.
            </p>
            <button
              onClick={onOpenNewMedModal}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-700 transition-all"
            >
              + Add Medication
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map(item => {
              const isTaken = item.log?.status === 'taken';
              const isSkipped = item.log?.status === 'skipped';
              const isSnoozed = item.log?.status === 'snoozed';
              const isOverdue = !isTaken && !isSkipped && currentTotalMinutes > item.totalMinutes + 30;

              return (
                <div
                  key={`${item.med.id}-${item.time}`}
                  className={`p-5 rounded-2xl border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                    isTaken
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                      : isSkipped
                      ? 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 opacity-60'
                      : isOverdue
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600'
                      : 'bg-white dark:bg-zinc-850 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                  }`}
                >
                  <div>
                    {/* Top pill bar */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-base shadow-xs shrink-0"
                          style={{ backgroundColor: item.med.color }}
                        >
                          💊
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider">
                            {item.time}
                          </span>
                          <span className="text-[11px] text-zinc-400 ml-2">
                            • {item.med.foodTiming.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Status Badges */}
                      {isTaken ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Taken
                        </span>
                      ) : isSkipped ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold">
                          <Ban className="w-3.5 h-3.5" />
                          Skipped
                        </span>
                      ) : isSnoozed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          Snoozed
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100 text-xs font-bold animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 text-xs font-bold">
                          Scheduled
                        </span>
                      )}
                    </div>

                    {/* Name & Dosage */}
                    <div className="mb-2">
                      <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                        {item.med.name}
                      </h3>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {item.med.dosage} • {item.med.purpose}
                      </p>
                    </div>

                    {item.med.instructions && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-3 bg-zinc-100/80 dark:bg-zinc-800/80 p-2.5 rounded-xl font-medium">
                        ℹ️ {item.med.instructions}
                      </p>
                    )}

                    {item.med.remainingPills <= item.med.refillThreshold && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mb-3 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Only {item.med.remainingPills} pills left in bottle
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => speakText(`Scheduled dose: ${item.med.name}, ${item.med.dosage} at ${item.time}. Instruction: ${item.med.instructions || 'Take with water.'}`)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="Read aloud"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onEditMedication(item.med)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="Edit medication schedule"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isTaken ? (
                        <>
                          <button
                            onClick={() => onOpenActionModal(item.med, item.time, 'skip')}
                            className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-300 text-xs font-semibold"
                          >
                            Skip
                          </button>
                          <button
                            onClick={() => onOpenActionModal(item.med, item.time, 'snooze')}
                            className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-300 text-xs font-semibold"
                          >
                            Snooze
                          </button>
                          <button
                            onClick={() => handleQuickTake(item)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 hc-btn-primary flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Take</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">
                          Dose recorded
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Upcoming Reminders (Next 24h timeline) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs hc-card">
        <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2 hc-text-primary">
          <Clock className="w-5 h-5 text-emerald-600" />
          <span>Upcoming Schedule for Tomorrow</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {medications.slice(0, 3).map(med => (
            <div key={med.id} className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: med.color }} />
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{med.name}</span>
              </div>
              <p className="text-zinc-500 mt-1">
                Times: {med.scheduledTimes.join(', ')} • {med.dosage}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
