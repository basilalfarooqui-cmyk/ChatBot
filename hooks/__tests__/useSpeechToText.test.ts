import { act, renderHook } from '@testing-library/react-native';
import * as ExpoAudio from 'expo-audio';
import { useSpeechToText } from '../useSpeechToText';

const originalFetch = global.fetch;

describe('useSpeechToText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ExpoAudio as any).__reset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('start() requests permission, records, and sets isListening true', async () => {
    const { result } = renderHook(() => useSpeechToText('hi', jest.fn()));
    let started: boolean | undefined;
    await act(async () => {
      started = await result.current.start();
    });

    expect(ExpoAudio.requestRecordingPermissionsAsync).toHaveBeenCalled();
    const recorder = (ExpoAudio as any).__getMockRecorder();
    expect(recorder.prepareToRecordAsync).toHaveBeenCalled();
    expect(recorder.record).toHaveBeenCalled();
    expect(started).toBe(true);
    expect(result.current.isListening).toBe(true);
  });

  it('start() returns false and does not record when permission is denied', async () => {
    (ExpoAudio.requestRecordingPermissionsAsync as jest.Mock).mockResolvedValueOnce({ granted: false });
    const { result } = renderHook(() => useSpeechToText('hi', jest.fn()));
    let started: boolean | undefined;
    await act(async () => {
      started = await result.current.start();
    });

    expect(started).toBe(false);
    expect(result.current.isListening).toBe(false);
  });

  it('stop() moves from listening to transcribing immediately', async () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    const { result } = renderHook(() => useSpeechToText('hi', jest.fn()));
    await act(async () => {
      await result.current.start();
    });

    act(() => {
      void result.current.stop();
    });
    expect(result.current.isListening).toBe(false);
    expect(result.current.isTranscribing).toBe(true);
  });

  it('stop() uploads the recording and forwards the transcribed text to onResult', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'नमस्ते' }),
    }) as unknown as typeof fetch;

    const onResult = jest.fn();
    const { result } = renderHook(() => useSpeechToText('hi', onResult));
    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      await result.current.stop();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/voice/transcribe'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(onResult).toHaveBeenCalledWith('नमस्ते');
    expect(result.current.isTranscribing).toBe(false);
  });

  it('stop() does not throw and clears isTranscribing when the upload fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch;

    const onResult = jest.fn();
    const { result } = renderHook(() => useSpeechToText('hi', onResult));
    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      await result.current.stop();
    });

    expect(onResult).not.toHaveBeenCalled();
    expect(result.current.isTranscribing).toBe(false);
  });
});
