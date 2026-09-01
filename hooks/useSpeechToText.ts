import { useCallback, useEffect, useRef, useState } from 'react';
import Voice from '@react-native-voice/voice';

export type SpeechToText = {
  isListening: boolean;
  isTranscribing: boolean;
  start: () => Promise<boolean>;
  stop: () => Promise<void>;
};

export function useSpeechToText(
  voiceLocale: string | undefined,
  onResult: (text: string) => void
): SpeechToText {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    Voice.onSpeechResults = event => {
      const text = event.value?.[0];
      if (text) onResultRef.current(text);
      setIsTranscribing(false);
    };
    Voice.onSpeechError = () => {
      setIsListening(false);
      setIsTranscribing(false);
    };
    // The recognizer stops listening on its own (e.g. after silence) before
    // results arrive -- that gap is the "transcribing" state, not idle.
    Voice.onSpeechEnd = () => {
      setIsListening(false);
      setIsTranscribing(true);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners).catch(() => {});
    };
  }, []);

  const start = useCallback(async () => {
    if (!voiceLocale) return false;
    try {
      await Voice.start(voiceLocale);
      setIsListening(true);
      setIsTranscribing(false);
      return true;
    } catch {
      setIsListening(false);
      return false;
    }
  }, [voiceLocale]);

  const stop = useCallback(async () => {
    try {
      await Voice.stop();
    } catch {
      // best effort
    } finally {
      setIsListening(false);
      setIsTranscribing(true);
    }
  }, []);

  return { isListening, isTranscribing, start, stop };
}
