import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import { VOICE_RELIABLE_CODES } from '../i18n/languages';

export type VoiceAvailability = {
  sttAvailable: boolean;
  ttsAvailable: boolean;
  checked: boolean;
};

export function useVoiceAvailability(
  languageCode: string,
  voiceLocale: string | undefined
): VoiceAvailability {
  const [state, setState] = useState<VoiceAvailability>({
    sttAvailable: false,
    ttsAvailable: false,
    checked: false,
  });

  useEffect(() => {
    let mounted = true;
    setState({ sttAvailable: false, ttsAvailable: false, checked: false });

    async function check() {
      if (Platform.OS === 'web' || !voiceLocale) {
        if (mounted) setState({ sttAvailable: false, ttsAvailable: false, checked: true });
        return;
      }

      const reliable = VOICE_RELIABLE_CODES.includes(languageCode);
      let stt = false;
      let tts = false;

      try {
        const sttModuleAvailable = await Voice.isAvailable();
        if (sttModuleAvailable) {
          if (Platform.OS === 'android') {
            const services: string[] = await Voice.getSpeechRecognitionServices();
            stt = reliable && Array.isArray(services) && services.length > 0;
          } else {
            stt = reliable;
          }
        }
      } catch {
        stt = false;
      }

      try {
        const voices: { language: string }[] = await Tts.voices();
        const prefix = voiceLocale.split('-')[0].toLowerCase();
        tts = Array.isArray(voices) && voices.some(v => v.language?.toLowerCase().startsWith(prefix));
      } catch {
        tts = false;
      }

      if (mounted) setState({ sttAvailable: stt, ttsAvailable: tts, checked: true });
    }

    void check();
    return () => {
      mounted = false;
    };
  }, [languageCode, voiceLocale]);

  return state;
}
