import { useCallback } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export type TextToSpeech = {
  isSpeaking: boolean;
  speak: (text: string) => Promise<boolean>;
  stop: () => Promise<void>;
};

// Cloud TTS (Gemini) instead of the device's on-device voice packs -- works
// the same for every language regardless of what's installed on the phone,
// same reasoning as the STT switch. No language param needed: Gemini infers
// pronunciation from the text's own script.
export function useTextToSpeech(): TextToSpeech {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  const speak = useCallback(
    async (text: string) => {
      try {
        const url = `${BACKEND_URL}/voice/speak?text=${encodeURIComponent(text)}`;
        player.replace({ uri: url });
        player.play();
        return true;
      } catch {
        return false;
      }
    },
    [player]
  );

  const stop = useCallback(async () => {
    try {
      player.pause();
      await player.seekTo(0);
    } catch {
      // best effort
    }
  }, [player]);

  return { isSpeaking: status.playing, speak, stop };
}
