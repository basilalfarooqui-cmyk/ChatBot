import { useCallback, useEffect, useRef, useState } from 'react';
import Voice from '@react-native-voice/voice';

export type SpeechToText = {
  isListening: boolean;
  start: () => Promise<boolean>;
  stop: () => Promise<void>;
};

export function useSpeechToText(
  voiceLocale: string | undefined,
  onResult: (text: string) => void
): SpeechToText {
  const [isListening, setIsListening] = useState(false);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    Voice.onSpeechResults = event => {
      const text = event.value?.[0];
      if (text) onResultRef.current(text);
    };
    Voice.onSpeechError = () => setIsListening(false);
    Voice.onSpeechEnd = () => setIsListening(false);

    return () => {
      Voice.destroy().then(Voice.removeAllListeners).catch(() => {});
    };
  }, []);

  const start = useCallback(async () => {
    if (!voiceLocale) return false;
    try {
      await Voice.start(voiceLocale);
      setIsListening(true);
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
    }
  }, []);

  return { isListening, start, stop };
}
