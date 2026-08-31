import { useCallback, useState } from 'react';
import Tts from 'react-native-tts';

export type TextToSpeech = {
  isSpeaking: boolean;
  speak: (text: string, voiceLocale: string) => Promise<boolean>;
  stop: () => Promise<void>;
};

export function useTextToSpeech(): TextToSpeech {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback(async (text: string, voiceLocale: string) => {
    try {
      await Tts.setDefaultLanguage(voiceLocale);
      await Tts.speak(text);
      setIsSpeaking(true);
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
