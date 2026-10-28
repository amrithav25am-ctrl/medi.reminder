import React, { useEffect, useState } from 'react';
import { Mic, MicOff, X, Volume2, Sparkles, Check, HelpCircle } from 'lucide-react';
import { voiceAssistant, VoiceCommandResult } from '../services/voiceService';
import { speakText, playSuccessChime, playWarningTone } from '../services/soundService';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTakeDoseByName: (medName: string) => boolean;
  onQueryNextDose: () => string;
  onToggleSeniorMode: () => void;
  onToggleHighContrast: () => void;
  onNavigateTab: (tab: 'schedule' | 'history' | 'caregiver' | 'backup') => void;
  onTriggerCaregiverAlert: () => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onTakeDoseByName,
  onQueryNextDose,
  onToggleSeniorMode,
  onToggleHighContrast,
  onNavigateTab,
  onTriggerCaregiverAlert,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('Listening... Say something like "Take Lisinopril" or "What is next?"');
  const [lastActionStatus, setLastActionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isOpen) {
      startListeningSession();
    } else {
      voiceAssistant.stopListening();
      setIsListening(false);
      setTranscript('');
      setLastActionStatus('idle');
    }
    return () => {
      voiceAssistant.stopListening();
    };
  }, [isOpen]);

  const startListeningSession = () => {
    setTranscript('');
    setFeedbackMessage('Listening... Speak now.');
    setLastActionStatus('idle');
    setIsListening(true);

    voiceAssistant.startListening(
      (interim) => {
        setTranscript(interim);
      },
      (result: VoiceCommandResult) => {
        handleParsedVoiceCommand(result);
      },
      (err) => {
        setIsListening(false);
        setFeedbackMessage(err);
        setLastActionStatus('error');
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const handleParsedVoiceCommand = (result: VoiceCommandResult) => {
    setTranscript(result.transcript);

    switch (result.intent) {
      case 'TAKE_DOSE': {
        const query = result.matchedMedicationName || '';
        const found = onTakeDoseByName(query);
        if (found) {
          playSuccessChime();
          const response = `Marked dose of ${query || 'your current medication'} as taken! Great job keeping up with your health.`;
          setFeedbackMessage(response);
          setLastActionStatus('success');
          speakText(response);
        } else {
          playWarningTone();
          const response = `I couldn't find a pending dose for "${query}". Please check your schedule.`;
          setFeedbackMessage(response);
          setLastActionStatus('error');
          speakText(response);
        }
        break;
      }
      case 'QUERY_NEXT': {
        const nextInfo = onQueryNextDose();
        setFeedbackMessage(nextInfo);
        setLastActionStatus('success');
        speakText(nextInfo);
        break;
      }
      case 'TOGGLE_SENIOR_MODE': {
        onToggleSeniorMode();
        playSuccessChime();
        const response = 'Senior high-accessibility mode toggled.';
        setFeedbackMessage(response);
        setLastActionStatus('success');
        speakText(response);
        break;
      }
      case 'TOGGLE_HIGH_CONTRAST': {
        onToggleHighContrast();
        playSuccessChime();
        const response = 'High contrast display toggled.';
        setFeedbackMessage(response);
        setLastActionStatus('success');
        speakText(response);
        break;
      }
      case 'GO_TO_HISTORY': {
        onNavigateTab('history');
        playSuccessChime();
        const response = 'Opening your medication history and adherence calendar.';
        setFeedbackMessage(response);
        setLastActionStatus('success');
        speakText(response);
        break;
      }
      case 'GO_TO_SCHEDULE': {
        onNavigateTab('schedule');
        playSuccessChime();
        const response = 'Opening today\'s schedule.';
        setFeedbackMessage(response);
        setLastActionStatus('success');
        speakText(response);
        break;
      }
      case 'ALERT_CAREGIVER': {
        onTriggerCaregiverAlert();
        playWarningTone();
        const response = 'Sent an urgent alert notification to your caregiver.';
        setFeedbackMessage(response);
        setLastActionStatus('success');
        speakText(response);
        break;
      }
      default: {
        const response = `I heard: "${result.transcript}". You can say: "Take Lisinopril", "What is next?", or "Senior Mode".`;
        setFeedbackMessage(response);
        setLastActionStatus('idle');
        speakText(response);
        break;
      }
    }
  };

  const handleChipClick = (spokenCommand: string) => {
    setTranscript(spokenCommand);
    const parsed = voiceAssistant.parseIntent(spokenCommand);
    handleParsedVoiceCommand(parsed);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-md">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl hc-card relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close voice assistant"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Badge */}
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 hc-text-primary">
              Hands-Free Voice Assistant
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Speak naturally to log doses or navigate with ease
            </p>
          </div>
        </div>

        {/* Soundwave Animation & Mic Status */}
        <div className="my-6 p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 flex flex-col items-center justify-center min-h-[160px]">
          {isListening ? (
            <div className="flex items-center gap-1.5 h-12 mb-3">
              {[40, 75, 95, 60, 85, 100, 70, 45, 90, 60, 30].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-violet-600 dark:bg-violet-400 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.8s',
                  }}
                />
              ))}
            </div>
          ) : (
            <button
              onClick={startListeningSession}
              className="p-4 rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/30 transition-all mb-3 active:scale-95"
            >
              <Mic className="w-7 h-7" />
            </button>
          )}

          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 text-center max-w-sm">
            {transcript ? `"${transcript}"` : isListening ? 'Speak now into your microphone...' : 'Tap the microphone to speak'}
          </p>

          <p className={`text-xs mt-2 text-center font-medium ${
            lastActionStatus === 'success' 
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : lastActionStatus === 'error'
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}>
            {feedbackMessage}
          </p>
        </div>

        {/* Quick Voice Commands to Click or Say */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Example Voice Commands:
            </span>
            <span className="text-xs text-violet-600 dark:text-violet-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Tap any to test
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              'Take Lisinopril',
              'What is my next medicine?',
              'Senior mode on',
              'High contrast mode',
              'Show my history',
              'Call caregiver',
            ].map((cmd) => (
              <button
                key={cmd}
                onClick={() => handleChipClick(cmd)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-violet-100 dark:bg-zinc-800 dark:hover:bg-violet-950/60 text-zinc-700 dark:text-zinc-300 hover:text-violet-700 dark:hover:text-violet-300 border border-zinc-200 dark:border-zinc-700 transition-all text-left"
              >
                "{cmd}"
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={() => {
              if (isListening) {
                voiceAssistant.stopListening();
                setIsListening(false);
              } else {
                startListeningSession();
              }
            }}
            className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1.5"
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4 text-rose-500" />
                <span>Stop Listening</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-violet-600" />
                <span>Restart Mic</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-all"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
