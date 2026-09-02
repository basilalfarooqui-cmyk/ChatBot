import { useCallback, useState } from 'react';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import { LANGUAGES } from '../i18n/languages';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export type SpeechToText = {
  isListening: boolean;
  isTranscribing: boolean;
  start: () => Promise<boolean>;
  stop: () => Promise<void>;
};

// Cloud STT (Gemini) instead of the device's on-device SpeechRecognizer --
// works the same for every language regardless of what speech engine the
// phone has installed, and there's no native silence-timeout to fight
// since this is a fixed record-then-upload step, not continuous listening.
export function useSpeechToText(
  languageCode: string,
  onResult: (text: string) => void
): SpeechToText {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const start = useCallback(async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) return false;

      await setAudioModeAsync({ allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsListening(true);
      setIsTranscribing(false);
      return true;
    } catch {
      setIsListening(false);
      return false;
    }
  }, [recorder]);

  const stop = useCallback(async () => {
    setIsListening(false);
    setIsTranscribing(true);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('No recording produced');

      const languageHint = LANGUAGES.find(l => l.code === languageCode)?.englishName;

      const formData = new FormData();
      formData.append('audio', {
        uri,
        name: 'recording.m4a',
        type: 'audio/aac',
      } as unknown as Blob);
      if (languageHint) formData.append('language', languageHint);

      const res = await fetch(`${BACKEND_URL}/voice/transcribe`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.text) onResult(data.text);
    } catch {
      // best effort -- leave input empty rather than crash
    } finally {
      setIsTranscribing(false);
    }
  }, [recorder, languageCode, onResult]);

  return { isListening, isTranscribing, start, stop };
}
