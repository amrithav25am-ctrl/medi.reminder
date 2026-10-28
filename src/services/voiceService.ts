// Define standard SpeechRecognition types for browsers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionType = any;

interface IWindow extends Window {
  SpeechRecognition?: SpeechRecognitionType;
  webkitSpeechRecognition?: SpeechRecognitionType;
}

export type VoiceIntentType = 
  | 'TAKE_DOSE'
  | 'QUERY_NEXT'
  | 'TOGGLE_SENIOR_MODE'
  | 'TOGGLE_HIGH_CONTRAST'
  | 'GO_TO_SCHEDULE'
  | 'GO_TO_HISTORY'
  | 'ALERT_CAREGIVER'
  | 'UNKNOWN';

export interface VoiceCommandResult {
  intent: VoiceIntentType;
  transcript: string;
  matchedMedicationName?: string;
  confidence: number;
}

export class VoiceAssistant {
  private recognition: SpeechRecognitionType | null = null;
  public isSupported: boolean = false;
  private isListening: boolean = false;

  constructor() {
    const customWindow = window as unknown as IWindow;
    const SpeechRecognitionClass = customWindow.SpeechRecognition || customWindow.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      this.isSupported = true;
      try {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
      } catch (e) {
        console.warn('Speech recognition init error:', e);
        this.isSupported = false;
      }
    }
  }

  public startListening(
    onInterim: (text: string) => void,
    onResult: (result: VoiceCommandResult) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ) {
    if (!this.recognition) {
      onError('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.isListening = true;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcriptPart;
        } else {
          interim += transcriptPart;
        }
      }

      if (interim) {
        onInterim(interim);
      }

      if (final) {
        const parsed = this.parseIntent(final);
        onResult(parsed);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('Voice recognition error:', event.error);
      this.isListening = false;
      onError(event.error === 'not-allowed' ? 'Microphone permission was denied.' : `Speech error: ${event.error}`);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.warn('Failed to start recognition', e);
      this.isListening = false;
      onError('Could not activate microphone.');
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.isListening = false;
    }
  }

  public parseIntent(transcript: string): VoiceCommandResult {
    const text = transcript.toLowerCase().trim();

    // Check for take dose
    if (text.includes('take') || text.includes('took') || text.includes('swallow') || text.includes('drank') || text.includes('done')) {
      const words = text.replace(/take|took|i took|i have taken|swallow|done with|my/g, '').trim();
      return {
        intent: 'TAKE_DOSE',
        transcript,
        matchedMedicationName: words.length > 0 ? words : undefined,
        confidence: 0.9,
      };
    }

    // Check for what's next
    if (text.includes('next') || text.includes('when') || text.includes('upcoming') || text.includes('what medicine') || text.includes('schedule')) {
      return {
        intent: 'QUERY_NEXT',
        transcript,
        confidence: 0.95,
      };
    }

    // Senior mode
    if (text.includes('senior') || text.includes('large text') || text.includes('big font') || text.includes('simple mode') || text.includes('easy mode')) {
      return {
        intent: 'TOGGLE_SENIOR_MODE',
        transcript,
        confidence: 0.9,
      };
    }

    // High contrast
    if (text.includes('contrast') || text.includes('black and white') || text.includes('dark') || text.includes('high contrast')) {
      return {
        intent: 'TOGGLE_HIGH_CONTRAST',
        transcript,
        confidence: 0.9,
      };
    }

    // History / adherence
    if (text.includes('history') || text.includes('log') || text.includes('past') || text.includes('record')) {
      return {
        intent: 'GO_TO_HISTORY',
        transcript,
        confidence: 0.85,
      };
    }

    // Caregiver alert
    if (text.includes('caregiver') || text.includes('call') || text.includes('help') || text.includes('sos') || text.includes('daughter') || text.includes('son') || text.includes('nurse')) {
      return {
        intent: 'ALERT_CAREGIVER',
        transcript,
        confidence: 0.95,
      };
    }

    return {
      intent: 'UNKNOWN',
      transcript,
      confidence: 0.3,
    };
  }
}

export const voiceAssistant = new VoiceAssistant();
