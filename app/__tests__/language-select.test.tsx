import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockParams: { from?: string } = {};

jest.mock('expo-router', () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args), back: () => mockBack() },
  useLocalSearchParams: () => mockParams,
}));

const mockSetLanguage = jest.fn(() => Promise.resolve());
jest.mock('../../i18n/LanguageContext', () => ({
  useLanguage: () => ({ setLanguage: mockSetLanguage, t: (k: string) => k }),
}));

import LanguageSelectScreen from '../language-select';

describe('language-select screen', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockBack.mockClear();
    mockSetLanguage.mockClear();
    mockParams = {};
  });

  it('on first launch, selecting a language saves it and replaces into chat', async () => {
    render(<LanguageSelectScreen />);
    fireEvent.press(screen.getByTestId('lang-card-hi'));
    await waitFor(() => expect(mockSetLanguage).toHaveBeenCalledWith('hi'));
    expect(mockReplace).toHaveBeenCalledWith('/(main)/chat');
  });

  it('when opened from settings, selecting a language saves it and goes back', async () => {
    mockParams = { from: 'settings' };
    render(<LanguageSelectScreen />);
    fireEvent.press(screen.getByTestId('lang-card-ta'));
    await waitFor(() => expect(mockSetLanguage).toHaveBeenCalledWith('ta'));
    expect(mockBack).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
