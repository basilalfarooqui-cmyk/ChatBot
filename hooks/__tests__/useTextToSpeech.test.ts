import { act, renderHook } from '@testing-library/react-native';
import Tts from 'react-native-tts';
import { useTextToSpeech } from '../useTextToSpeech';

describe('useTextToSpeech', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Tts as any).__reset();
  });

  it('speak() sets the language and speaks, returning true on success', async () => {
    const { result } = renderHook(() => useTextToSpeech());
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.speak('hello', 'hi-IN');
    });
    expect(Tts.setDefaultLanguage).toHaveBeenCalledWith('hi-IN');
    expect(Tts.speak).toHaveBeenCalledWith('hello');
    expect(ok).toBe(true);
  });

  it('speak() returns false and does not throw when Tts.speak rejects', async () => {
    (Tts.speak as jest.Mock).mockRejectedValueOnce(new Error('no engine'));
    const { result } = renderHook(() => useTextToSpeech());
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.speak('hello', 'hi-IN');
    });
    expect(ok).toBe(false);
    expect(result.current.isSpeaking).toBe(false);
  });

  it('isSpeaking becomes true only on the real tts-start event', async () => {
    const { result } = renderHook(() => useTextToSpeech());
    expect(result.current.isSpeaking).toBe(false);
    await act(async () => {
      await result.current.speak('hello', 'hi-IN');
    });
    expect(result.current.isSpeaking).toBe(false);
    act(() => {
      (Tts as any).__emit('tts-start');
    });
    expect(result.current.isSpeaking).toBe(true);
  });

  it('isSpeaking turns false on the real tts-finish event, not before', async () => {
    const { result } = renderHook(() => useTextToSpeech());
    act(() => {
      (Tts as any).__emit('tts-start');
    });
    expect(result.current.isSpeaking).toBe(true);
    act(() => {
      (Tts as any).__emit('tts-finish');
    });
    expect(result.current.isSpeaking).toBe(false);
  });

  it('isSpeaking turns false on tts-cancel (manual stop)', async () => {
    const { result } = renderHook(() => useTextToSpeech());
    act(() => {
      (Tts as any).__emit('tts-start');
    });
    expect(result.current.isSpeaking).toBe(true);
    act(() => {
      (Tts as any).__emit('tts-cancel');
    });
    expect(result.current.isSpeaking).toBe(false);
  });

  it('stop() calls Tts.stop and clears isSpeaking', async () => {
    const { result } = renderHook(() => useTextToSpeech());
    act(() => {
      (Tts as any).__emit('tts-start');
    });
    await act(async () => {
      await result.current.stop();
    });
    expect(Tts.stop).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });
});
