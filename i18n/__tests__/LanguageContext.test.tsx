import React from 'react';
import { Text, Button } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageProvider, useLanguage, APP_LANGUAGE_KEY } from '../LanguageContext';

function Probe() {
  const { languageCode, t, setLanguage } = useLanguage();
  return (
    <>
      <Text testID="code">{languageCode}</Text>
      <Text testID="title">{t('chatTitle')}</Text>
      <Button title="set-hi" onPress={() => setLanguage('hi')} />
    </>
  );
}

describe('LanguageContext', () => {
  beforeEach(() => AsyncStorage.clear());

  it('defaults to English when nothing is stored', async () => {
    render(<LanguageProvider><Probe /></LanguageProvider>);
    await waitFor(() => expect(screen.getByTestId('code').props.children).toBe('en'));
    expect(screen.getByTestId('title').props.children).toBe('Chat');
  });

  it('hydrates the stored language on mount', async () => {
    await AsyncStorage.setItem(APP_LANGUAGE_KEY, 'hi');
    render(<LanguageProvider><Probe /></LanguageProvider>);
    await waitFor(() => expect(screen.getByTestId('code').props.children).toBe('hi'));
    expect(screen.getByTestId('title').props.children).toBe('चैट');
  });

  it('falls back to English for a key missing in a partially-translated language', async () => {
    await AsyncStorage.setItem(APP_LANGUAGE_KEY, 'or');
    render(<LanguageProvider><Probe /></LanguageProvider>);
    await waitFor(() => expect(screen.getByTestId('code').props.children).toBe('or'));
    expect(screen.getByTestId('title').props.children).toBe('Chat');
  });

  it('setLanguage updates context and persists to AsyncStorage', async () => {
    render(<LanguageProvider><Probe /></LanguageProvider>);
    await waitFor(() => expect(screen.getByTestId('code').props.children).toBe('en'));
    fireEvent.press(screen.getByText('set-hi'));
    await waitFor(() => expect(screen.getByTestId('code').props.children).toBe('hi'));
    expect(await AsyncStorage.getItem(APP_LANGUAGE_KEY)).toBe('hi');
  });
});
