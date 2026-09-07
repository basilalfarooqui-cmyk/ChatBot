import { useCallback } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export type TextToSpeech = {
  isSpeaking: boolean;
  speak: (text: string) => Promise<boolean>;
  stop: () => Promise<void>;
};

// replace() starts loading the new remote source asynchronously -- calling
// play() in the same tick can fire before there's anything loaded to play,
// silently doing nothing. Poll the player's own isLoaded flag directly
// (not the React-hook status, which only reflects the CURRENT render and
// won't retrigger anything on later replace() calls once it's already true)
// so this works correctly on every speak() call, not just the first.
function waitUntilLoaded(player: { isLoaded: boolean }, timeoutMs = 8000) {
  return new Promise<void>(resolve => {
    const start = Date.now();
    const check = () => {
      if (player.isLoaded || Date.now() - start > timeoutMs) {
        resolve();
        return;
      }
      setTimeout(check, 50);
    };
    check();
  });
}

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
        await waitUntilLoaded(player);
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
