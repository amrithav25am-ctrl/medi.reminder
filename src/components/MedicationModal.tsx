import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, Pill, AlertTriangle, Shield, Check } from 'lucide-react';
import { Medication, MedicationForm, FoodTiming, FrequencyType } from '../types';

interface MedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (med: Medication) => void;
  onDelete?: (medId: string) => void;
  editingMedication?: Medication | null;
}

const COLOR_OPTIONS = [
  '#fb7185', // rose
  '#38bdf8', // sky
  '#a78bfa', // purple
  '#fbbf24', // amber
  '#34d399', // emerald
  '#f472b6', // pink
  '#818cf8', // indigo
  '#94a3b8', // slate
];

const PRESET_TIMES = [
  { label: 'Morning (08:00)', time: '08:00' },
  { label: 'Noon (12:30)', time: '12:30' },
  { label: 'Evening (18:00)', time: '18:00' },
  { label: 'Bedtime (21:00)', time: '21:00' },
];

export const MedicationModal: React.FC<MedicationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingMedication,
}) => {
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [dosage, setDosage] = useState('');
  const [form, setForm] = useState<MedicationForm>('tablet');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [shape, setShape] = useState<'round' | 'oval' | 'capsule'>('round');
  const [frequency, setFrequency] = useState<FrequencyType>('daily');
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(['08:00']);
  const [customTimeInput, setCustomTimeInput] = useState('09:00');
  const [foodTiming, setFoodTiming] = useState<FoodTiming>('with_food');
  const [purpose, setPurpose] = useState('');
  const [instructions, setInstructions] = useState('');
  const [remainingPills, setRemainingPills] = useState(30);
  const [totalPills, setTotalPills] = useState(30);
  const [refillThreshold, setRefillThreshold] = useState(7);
  const [doctorName, setDoctorName] = useState('');
  const [pharmacyPhone, setPharmacyPhone] = useState('');

  useEffect(() => {
    if (editingMedication) {
      setName(editingMedication.name);
      setGenericName(editingMedication.genericName || '');
      setDosage(editingMedication.dosage);
      setForm(editingMedication.form);
      setColor(editingMedication.color);
      setShape(editingMedication.shape as 'round' | 'oval' | 'capsule');
      setFrequency(editingMedication.frequency);
      setScheduledTimes(editingMedication.scheduledTimes);
      setFoodTiming(editingMedication.foodTiming);
      setPurpose(editingMedication.purpose);
      setInstructions(editingMedication.instructions || '');
      setRemainingPills(editingMedication.remainingPills);
      setTotalPills(editingMedication.totalPills);
      setRefillThreshold(editingMedication.refillThreshold);
      setDoctorName(editingMedication.doctorName || '');
      setPharmacyPhone(editingMedication.pharmacyPhone || '');
    } else {
      setName('');
      setGenericName('');
      setDosage('');
      setForm('tablet');
      setColor(COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)]);
      setShape('round');
      setFrequency('daily');
      setScheduledTimes(['08:00']);
      setFoodTiming('with_food');
      setPurpose('');
      setInstructions('');
      setRemainingPills(30);
      setTotalPills(30);
      setRefillThreshold(7);
      setDoctorName('');
      setPharmacyPhone('');
    }
  }, [editingMedication, isOpen]);

  if (!isOpen) return null;

  const handleAddTime = (time: string) => {
    if (!scheduledTimes.includes(time)) {
      setScheduledTimes([...scheduledTimes, time].sort());
    }
  };

  const handleRemoveTime = (timeToRemove: string) => {
    if (scheduledTimes.length > 1) {
      setScheduledTimes(scheduledTimes.filter(t => t !== timeToRemove));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const med: Medication = {
      id: editingMedication ? editingMedication.id : `med-${Date.now()}`,
      name: name.trim(),
      genericName: genericName.trim() || undefined,
      dosage: dosage.trim() || '1 dose',
      form,
      color,
      shape,
      frequency,
      scheduledTimes: scheduledTimes.length > 0 ? scheduledTimes : ['08:00'],
      foodTiming,
      purpose: purpose.trim() || 'General health',
      instructions: instructions.trim() || undefined,
      remainingPills: Number(remainingPills) || 0,
      totalPills: Number(totalPills) || 30,
      refillThreshold: Number(refillThreshold) || 5,
      doctorName: doctorName.trim() || undefined,
      pharmacyPhone: pharmacyPhone.trim() || undefined,
      active: true,
      createdAt: editingMedication ? editingMedication.createdAt : new Date().toISOString(),
    };

    onSave(med);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl hc-card my-8 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-2xl shadow-sm"
              style={{ backgroundColor: color }}
            >
              💊
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 hc-text-primary">
                {editingMedication ? 'Edit Medication Schedule' : 'Add New Medication'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Setup dose timing, instructions, and refill thresholds
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

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Medication Name & Generic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Medication Brand Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Lisinopril, Lipitor"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Generic Name / Purpose
              </label>
              <input
                type="text"
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="e.g. Blood pressure control"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-emerald-500"
              />
            </div>
          </div>

          {/* Dosage & Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Dosage Amount *
              </label>
              <input
                type="text"
                required
                value={dosage}
                onChange={e => setDosage(e.target.value)}
                placeholder="e.g. 10mg (1 tablet), 2 puffs"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Medicine Form
              </label>
              <select
                value={form}
                onChange={e => setForm(e.target.value as MedicationForm)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                <option value="tablet">Tablet / Pill</option>
                <option value="capsule">Capsule / Softgel</option>
                <option value="liquid">Liquid / Syrup</option>
                <option value="inhaler">Inhaler</option>
                <option value="drops">Eye / Ear Drops</option>
                <option value="injection">Injection / Pen</option>
                <option value="patch">Transdermal Patch</option>
              </select>
            </div>
          </div>

          {/* Visual Pill Color & Shape */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
              Color Tag (Helps seniors distinguish bottles)
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-emerald-500' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Scheduled Times */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
              <span>Scheduled Reminder Times</span>
              <span className="text-[11px] text-zinc-400">Add all daily dose times</span>
            </label>

            {/* Current Active Times */}
            <div className="flex flex-wrap gap-2 mb-2">
              {scheduledTimes.map(time => (
                <span
                  key={time}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 text-xs font-bold border border-emerald-300 dark:border-emerald-800"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{time}</span>
                  {scheduledTimes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTime(time)}
                      className="hover:text-rose-600 transition-colors ml-1"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>

            {/* Quick Add Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              {PRESET_TIMES.map(p => (
                <button
                  key={p.time}
                  type="button"
                  onClick={() => handleAddTime(p.time)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                >
                  + {p.label}
                </button>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="time"
                  value={customTimeInput}
                  onChange={e => setCustomTimeInput(e.target.value)}
                  className="px-2 py-1 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                />
                <button
                  type="button"
                  onClick={() => handleAddTime(customTimeInput)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-800"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Food Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Meal Timing Instruction
              </label>
              <select
                value={foodTiming}
                onChange={e => setFoodTiming(e.target.value as FoodTiming)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                <option value="with_food">With Food / Meals</option>
                <option value="before_food">Before Food (Empty Stomach)</option>
                <option value="after_food">After Food</option>
                <option value="anytime">Any Time (With Water)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Special Doctor Instructions
              </label>
              <input
                type="text"
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="e.g. Avoid grapefruit, drink full glass"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Refill Inventory Tracking */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
                Pills Currently in Bottle
              </label>
              <input
                type="number"
                min="0"
                value={remainingPills}
                onChange={e => setRemainingPills(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-zinc-800 text-sm font-bold text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1">
                Refill Alert When Below
              </label>
              <input
                type="number"
                min="1"
                value={refillThreshold}
                onChange={e => setRefillThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-zinc-800 text-sm font-bold text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
            {editingMedication && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${editingMedication.name}?`)) {
                    onDelete(editingMedication.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 hc-btn-primary transition-all"
              >
                {editingMedication ? 'Save Changes' : 'Create Schedule'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
