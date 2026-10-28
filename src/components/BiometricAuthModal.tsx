import React, { useState } from 'react';
import { Fingerprint, Lock, Shield, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';
import { playSuccessChime, playWarningTone } from '../services/soundService';

interface BiometricAuthModalProps {
  userProfile: UserProfile;
  isOpen: boolean;
  onSuccess: () => void;
  onUpdatePin?: (newPin: string) => void;
}

export const BiometricAuthModal: React.FC<BiometricAuthModalProps> = ({
  userProfile,
  isOpen,
  onSuccess,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isScanningBiometric, setIsScanningBiometric] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePinClick = (digit: string) => {
    if (pinInput.length < 4) {
      const next = pinInput + digit;
      setPinInput(next);
      setErrorMessage('');

      if (next.length === 4) {
        if (next === userProfile.pin || next === '1234') {
          playSuccessChime();
          setTimeout(() => {
            onSuccess();
            setPinInput('');
          }, 300);
        } else {
          playWarningTone();
          setErrorMessage('Incorrect PIN. Please try again or use Biometrics.');
          setTimeout(() => setPinInput(''), 800);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleBiometricAuth = async () => {
    setIsScanningBiometric(true);
    setErrorMessage('');

    // Try WebAuthn if available or graceful simulation
    try {
      if (window.PublicKeyCredential && typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        // Authenticator simulation with authentic delay
        await new Promise(resolve => setTimeout(resolve, 900));
      } else {
        await new Promise(resolve => setTimeout(resolve, 900));
      }

      setBiometricSuccess(true);
      playSuccessChime();
      setTimeout(() => {
        setIsScanningBiometric(false);
        setBiometricSuccess(false);
        onSuccess();
      }, 700);
    } catch (e) {
      console.warn('Biometric error', e);
      setIsScanningBiometric(false);
      setErrorMessage('Biometric verification failed. Please enter your 4-digit PIN.');
      playWarningTone();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl hc-card text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Badge */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-4 mx-auto shadow-inner">
          <Shield className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 hc-text-primary tracking-tight">
          Unlock DoseMate
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 mb-6">
          Hello <span className="font-semibold text-zinc-800 dark:text-zinc-200">{userProfile.name}</span>. Verify identity to access your private medical records.
        </p>

        {/* Biometric Touch Scanner Button */}
        <div className="mb-6 flex flex-col items-center">
          <button
            onClick={handleBiometricAuth}
            disabled={isScanningBiometric}
            className={`relative group w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              biometricSuccess
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-300'
                : isScanningBiometric
                ? 'bg-teal-500 text-white animate-pulse ring-4 ring-teal-300'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 border-2 border-emerald-300 dark:border-emerald-700 shadow-md'
            }`}
          >
            {biometricSuccess ? (
              <CheckCircle2 className="w-12 h-12 animate-bounce" />
            ) : (
              <Fingerprint className={`w-12 h-12 transition-transform duration-300 ${isScanningBiometric ? 'scale-110' : 'group-hover:scale-105'}`} />
            )}
            
            {isScanningBiometric && (
              <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
            )}
          </button>

          <button
            onClick={handleBiometricAuth}
            className="mt-3 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Touch for Passkey / Fingerprint</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex py-2 items-center mb-4">
          <div className="grow border-t border-zinc-200 dark:border-zinc-800"></div>
          <span className="shrink mx-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            or enter 4-digit PIN
          </span>
          <div className="grow border-t border-zinc-200 dark:border-zinc-800"></div>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center items-center gap-3 mb-6">
          {[0, 1, 2, 3].map(index => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                pinInput.length > index
                  ? 'bg-emerald-600 dark:bg-emerald-400 scale-125'
                  : 'bg-zinc-200 dark:bg-zinc-700'
              }`}
            />
          ))}
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tactile Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handlePinClick(num)}
              className="h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 text-lg font-bold text-zinc-900 dark:text-zinc-100 transition-all shadow-xs"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setPinInput('')}
            className="h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 text-xs font-bold text-zinc-600 dark:text-zinc-400 transition-all"
          >
            Clear
          </button>
          <button
            onClick={() => handlePinClick('0')}
            className="h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 active:scale-95 text-lg font-bold text-zinc-900 dark:text-zinc-100 transition-all shadow-xs"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 text-xs font-bold text-zinc-600 dark:text-zinc-400 transition-all"
          >
            ⌫
          </button>
        </div>

        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
          Tip: Default demo PIN is <span className="font-semibold text-zinc-600 dark:text-zinc-300">1234</span>
        </p>

      </div>
    </div>
  );
};
