import { act, renderHook } from '@testing-library/react-native';
import * as ExpoAudio from 'expo-audio';
import { useTextToSpeech } from '../useTextToSpeech';

describe('useTextToSpeech', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ExpoAudio as any).__reset();
  });

  it('speak() replaces the player source with the backend TTS URL and plays it', async () => {
    const { result } = renderHook(() => useTextToSpeech());
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.speak('hello');
    });

    const player = (ExpoAudio as any).__getMockPlayer();
    expect(player.replace).toHaveBeenCalledWith(
      expect.objectContaining({ uri: expect.stringContaining('/voice/speak?text=hello') })
    );
    expect(player.play).toHaveBeenCalled();
    expect(ok).toBe(true);
  });

  it('isSpeaking reflects the real player playing state', async () => {
    const { result } = renderHook(() => useTextToSpeech());
    expect(result.current.isSpeaking).toBe(false);

    await act(async () => {
      await result.current.speak('hello');
    });
    expect(result.current.isSpeaking).toBe(true);
  });

  it('stop() pauses the player and clears isSpeaking', async () => {
    const { result } = renderHook(() => useTextToSpeech());
    await act(async () => {
      await result.current.speak('hello');
    });
    expect(result.current.isSpeaking).toBe(true);

    await act(async () => {
      await result.current.stop();
    });
    const player = (ExpoAudio as any).__getMockPlayer();
    expect(player.pause).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });
});
