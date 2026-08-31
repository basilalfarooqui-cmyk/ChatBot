// hooks/__tests__/useVoiceAvailability.test.ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import { useVoiceAvailability } from '../useVoiceAvailability';

describe('useVoiceAvailability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
  });

  it('is immediately unavailable when voiceLocale is undefined (e.g. Santali)', async () => {
    const { result } = renderHook(() => useVoiceAvailability('sat', undefined));
    await waitFor(() => expect(result.current.checked).toBe(true));
    expect(result.current.sttAvailable).toBe(false);
    expect(result.current.ttsAvailable).toBe(false);
    expect(Voice.isAvailable).not.toHaveBeenCalled();
  });

  it('is unavailable on web regardless of language', async () => {
    Platform.OS = 'web';
    const { result } = renderHook(() => useVoiceAvailability('hi', 'hi-IN'));
    await waitFor(() => expect(result.current.checked).toBe(true));
    expect(result.current.sttAvailable).toBe(false);
    expect(result.current.ttsAvailable).toBe(false);
  });

  it('reports both available for a whitelisted language with matching device support', async () => {
    (Voice.isAvailable as jest.Mock).mockResolvedValue(1);
    (Voice.getSpeechRecognitionServices as jest.Mock).mockResolvedValue(['com.google.android.tts']);
    (Tts.voices as jest.Mock).mockResolvedValue([{ language: 'hi-IN' }]);
    const { result } = renderHook(() => useVoiceAvailability('hi', 'hi-IN'));
    await waitFor(() => expect(result.current.checked).toBe(true));
    expect(result.current.sttAvailable).toBe(true);
    expect(result.current.ttsAvailable).toBe(true);
  });

  it('reports STT unavailable for a non-whitelisted language even if the device has recognizer services', async () => {
    (Voice.isAvailable as jest.Mock).mockResolvedValue(1);
    (Voice.getSpeechRecognitionServices as jest.Mock).mockResolvedValue(['com.google.android.tts']);
    (Tts.voices as jest.Mock).mockResolvedValue([{ language: 'or-IN' }]);
    const { result } = renderHook(() => useVoiceAvailability('or', 'or-IN'));
    await waitFor(() => expect(result.current.checked).toBe(true));
    expect(result.current.sttAvailable).toBe(false);
    expect(result.current.ttsAvailable).toBe(true);
  });

  it('does not crash and reports unavailable when Voice.isAvailable throws', async () => {
    (Voice.isAvailable as jest.Mock).mockRejectedValue(new Error('no module'));
    (Tts.voices as jest.Mock).mockResolvedValue([]);
    const { result } = renderHook(() => useVoiceAvailability('hi', 'hi-IN'));
    await waitFor(() => expect(result.current.checked).toBe(true));
    expect(result.current.sttAvailable).toBe(false);
  });

  it('does not crash and reports TTS unavailable when Tts.voices throws', async () => {
    (Voice.isAvailable as jest.Mock).mockResolvedValue(1);
    (Voice.getSpeechRecognitionServices as jest.Mock).mockResolvedValue(['x']);
    (Tts.voices as jest.Mock).mockRejectedValue(new Error('no tts'));
    const { result } = renderHook(() => useVoiceAvailability('hi', 'hi-IN'));
    await waitFor(() => expect(result.current.checked).toBe(true));
    expect(result.current.ttsAvailable).toBe(false);
  });
});
