import { act, renderHook } from '@testing-library/react-native';
import Tts from 'react-native-tts';
import { useTextToSpeech } from '../useTextToSpeech';

describe('useTextToSpeech', () => {
  beforeEach(() => jest.clearAllMocks());

  it('speak() sets the language, speaks, and returns true on success', async () => {
    const { result } = renderHook(() => useTextToSpeech());
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.speak('hello', 'hi-IN');
    });
    expect(Tts.setDefaultLanguage).toHaveBeenCalledWith('hi-IN');
    expect(Tts.speak).toHaveBeenCalledWith('hello');
    expect(ok).toBe(true);
    expect(result.current.isSpeaking).toBe(true);
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
});
