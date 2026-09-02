import { Platform } from 'react-native';

export type VoiceAvailability = {
  sttAvailable: boolean;
  ttsAvailable: boolean;
  checked: boolean;
};

// Voice input/output goes through cloud Gemini now (record-and-upload for
// STT, fetch-and-play for TTS), not the device's own speech engine -- so
// availability no longer depends on per-language device support or which
// voice packs happen to be installed. It works the same for every one of
// the 23 languages. Only real platform limit left: no recording/playback
// wiring built for web.
export function useVoiceAvailability(): VoiceAvailability {
  const available = Platform.OS !== 'web';
  return { sttAvailable: available, ttsAvailable: available, checked: true };
}
