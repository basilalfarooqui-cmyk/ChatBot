import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));

jest.mock('../../../i18n/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, languageCode: 'ta' }),
}));

import SettingsScreen from '../settings';

describe('SettingsScreen', () => {
  beforeEach(() => mockPush.mockClear());

  it('shows the current language native name', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('தமிழ்')).toBeTruthy();
  });

  it('navigates to language-select with from=settings when the row is pressed', () => {
    render(<SettingsScreen />);
    fireEvent.press(screen.getByTestId('change-language-row'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/language-select', params: { from: 'settings' } });
  });

  it('shows the backend-not-connected note', () => {
    render(<SettingsScreen />);
    expect(screen.getByTestId('backend-note')).toBeTruthy();
  });
});
