import React from 'react';
import { render, screen } from '@testing-library/react-native';
import VoiceUnavailableNote from '../VoiceUnavailableNote';

jest.mock('../../i18n/LanguageContext', () => ({
  useLanguage: () => ({ t: () => 'Voice not available for this language on your device — text input still works.' }),
}));

describe('VoiceUnavailableNote', () => {
  it('renders nothing when not visible', () => {
    render(<VoiceUnavailableNote visible={false} />);
    expect(screen.queryByTestId('voice-unavailable-note')).toBeNull();
  });

  it('renders the note text when visible', () => {
    render(<VoiceUnavailableNote visible />);
    expect(screen.getByTestId('voice-unavailable-note')).toBeTruthy();
    expect(
      screen.getByText('Voice not available for this language on your device — text input still works.')
    ).toBeTruthy();
  });
});
