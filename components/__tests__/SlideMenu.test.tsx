// components/__tests__/SlideMenu.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import SlideMenu from '../SlideMenu';

jest.mock('../../i18n/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k }),
}));

describe('SlideMenu', () => {
  it('calls onNewChat when New Chat is pressed', async () => {
    const onNewChat = jest.fn();
    render(
      <SlideMenu
        isOpen
        onClose={jest.fn()}
        languageName="English"
        onNewChat={onNewChat}
        onHistory={jest.fn()}
        onSettings={jest.fn()}
      />
    );
    fireEvent.press(screen.getByTestId('menu-new-chat'));
    await waitFor(() => expect(onNewChat).toHaveBeenCalled());
  });

  it('calls onHistory when History is pressed', async () => {
    const onHistory = jest.fn();
    render(
      <SlideMenu
        isOpen
        onClose={jest.fn()}
        languageName="English"
        onNewChat={jest.fn()}
        onHistory={onHistory}
        onSettings={jest.fn()}
      />
    );
    fireEvent.press(screen.getByTestId('menu-history'));
    await waitFor(() => expect(onHistory).toHaveBeenCalled());
  });

  it('calls onSettings when Settings is pressed', async () => {
    const onSettings = jest.fn();
    render(
      <SlideMenu
        isOpen
        onClose={jest.fn()}
        languageName="English"
        onNewChat={jest.fn()}
        onHistory={jest.fn()}
        onSettings={onSettings}
      />
    );
    fireEvent.press(screen.getByTestId('menu-settings'));
    await waitFor(() => expect(onSettings).toHaveBeenCalled());
  });

  it('shows the current language name', () => {
    render(
      <SlideMenu
        isOpen
        onClose={jest.fn()}
        languageName="தமிழ்"
        onNewChat={jest.fn()}
        onHistory={jest.fn()}
        onSettings={jest.fn()}
      />
    );
    expect(screen.getByText('தமிழ்')).toBeTruthy();
  });
});
