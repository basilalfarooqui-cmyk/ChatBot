import { act, renderHook, waitFor } from '@testing-library/react-native';
import Voice from '@react-native-voice/voice';
import { useSpeechToText } from '../useSpeechToText';

describe('useSpeechToText', () => {
  beforeEach(() => jest.clearAllMocks());

  it('start() returns false and never calls Voice.start when voiceLocale is undefined', async () => {
    const { result } = renderHook(() => useSpeechToText(undefined, jest.fn()));
    let started: boolean | undefined;
    await act(async () => {
      started = await result.current.start();
    });
    expect(started).toBe(false);
    expect(Voice.start).not.toHaveBeenCalled();
  });

  it('start() calls Voice.start with the locale and sets isListening true', async () => {
    const { result } = renderHook(() => useSpeechToText('hi-IN', jest.fn()));
    await act(async () => {
      await result.current.start();
    });
    expect(Voice.start).toHaveBeenCalledWith('hi-IN');
    expect(result.current.isListening).toBe(true);
  });

  it('start() returns false and does not throw when Voice.start rejects', async () => {
    (Voice.start as jest.Mock).mockRejectedValueOnce(new Error('mic busy'));
    const { result } = renderHook(() => useSpeechToText('hi-IN', jest.fn()));
    let started: boolean | undefined;
    await act(async () => {
      started = await result.current.start();
    });
    expect(started).toBe(false);
    expect(result.current.isListening).toBe(false);
  });

  it('forwards recognized speech to onResult via the Voice.onSpeechResults callback', async () => {
    const onResult = jest.fn();
    renderHook(() => useSpeechToText('hi-IN', onResult));
    await waitFor(() => expect(typeof (Voice as any).onSpeechResults).toBe('function'));
    act(() => {
      (Voice as any).onSpeechResults({ value: ['नमस्ते'] });
    });
    expect(onResult).toHaveBeenCalledWith('नमस्ते');
  });

  it('enters isTranscribing when the recognizer ends on its own before a result arrives', async () => {
    const { result } = renderHook(() => useSpeechToText('hi-IN', jest.fn()));
    await waitFor(() => expect(typeof (Voice as any).onSpeechEnd).toBe('function'));
    act(() => {
      (Voice as any).onSpeechEnd();
    });
    expect(result.current.isListening).toBe(false);
    expect(result.current.isTranscribing).toBe(true);
  });

  it('clears isTranscribing once a result arrives', async () => {
    const { result } = renderHook(() => useSpeechToText('hi-IN', jest.fn()));
    act(() => {
      (Voice as any).onSpeechEnd();
    });
    expect(result.current.isTranscribing).toBe(true);
    act(() => {
      (Voice as any).onSpeechResults({ value: ['hello'] });
    });
    expect(result.current.isTranscribing).toBe(false);
  });

  it('stop() moves from listening to transcribing, not to idle', async () => {
    const { result } = renderHook(() => useSpeechToText('hi-IN', jest.fn()));
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.isListening).toBe(true);
    await act(async () => {
      await result.current.stop();
    });
    expect(result.current.isListening).toBe(false);
    expect(result.current.isTranscribing).toBe(true);
  });
});
