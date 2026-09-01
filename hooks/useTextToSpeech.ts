import { useCallback, useEffect, useState } from 'react';
import Tts from 'react-native-tts';

export type TextToSpeech = {
  isSpeaking: boolean;
  speak: (text: string, voiceLocale: string) => Promise<boolean>;
  stop: () => Promise<void>;
};

export function useTextToSpeech(): TextToSpeech {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // Reflect real playback state, not just "the speak() call was sent" --
    // tts-finish/tts-cancel are what tell us it actually stopped, so the UI
    // never shows "speaking" after playback has genuinely ended, and never
    // turns itself off early while audio is still playing.
    const onStart = () => setIsSpeaking(true);
    const onFinish = () => setIsSpeaking(false);
    const onCancel = () => setIsSpeaking(false);

    Tts.addEventListener('tts-start', onStart);
    Tts.addEventListener('tts-finish', onFinish);
    Tts.addEventListener('tts-cancel', onCancel);

    return () => {
      Tts.removeEventListener('tts-start', onStart);
      Tts.removeEventListener('tts-finish', onFinish);
      Tts.removeEventListener('tts-cancel', onCancel);
    };
  }, []);

  const speak = useCallback(async (text: string, voiceLocale: string) => {
    try {
      await Tts.setDefaultLanguage(voiceLocale);
      await Tts.speak(text);
      return true;
    } catch {
      setIsSpeaking(false);
      return false;
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      await Tts.stop();
    } catch {
      // best effort
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  return { isSpeaking, speak, stop };
}
