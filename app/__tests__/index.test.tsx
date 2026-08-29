import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
}));

import Index from '../index';

describe('app/index startup gate', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    mockReplace.mockClear();
  });

  it('routes to language-select when no language is stored', async () => {
    render(<Index />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/language-select'));
  });

  it('routes straight to chat when a language is already stored', async () => {
    await AsyncStorage.setItem('appLanguage', 'hi');
    render(<Index />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(main)/chat'));
  });
});
