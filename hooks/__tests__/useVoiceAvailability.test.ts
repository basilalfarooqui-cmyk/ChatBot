import { renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useVoiceAvailability } from '../useVoiceAvailability';

describe('useVoiceAvailability', () => {
  beforeEach(() => {
    Platform.OS = 'android';
  });

  it('is available on native platforms, for any language', () => {
    const { result } = renderHook(() => useVoiceAvailability());
    expect(result.current.checked).toBe(true);
    expect(result.current.sttAvailable).toBe(true);
    expect(result.current.ttsAvailable).toBe(true);
  });

  it('is unavailable on web', () => {
    Platform.OS = 'web';
    const { result } = renderHook(() => useVoiceAvailability());
    expect(result.current.checked).toBe(true);
    expect(result.current.sttAvailable).toBe(false);
    expect(result.current.ttsAvailable).toBe(false);
  });
});
