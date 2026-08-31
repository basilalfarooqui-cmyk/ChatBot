import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));

jest.mock('../../../i18n/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, languageCode: 'en' }),
}));

const mockSendMessage = jest.fn(() => Promise.resolve());
const mockStartNewConversation = jest.fn();
let mockConversations: any[] = [];
let mockActiveId: string | null = null;

jest.mock('../../../store/chatStore', () => ({
  useChatStore: (selector: any) =>
    selector({
      conversations: mockConversations,
      activeConversationId: mockActiveId,
      sendMessage: mockSendMessage,
      startNewConversation: mockStartNewConversation,
    }),
}));

jest.mock('../../../hooks/useVoiceAvailability', () => ({
  useVoiceAvailability: () => ({ sttAvailable: true, ttsAvailable: true, checked: true }),
}));
jest.mock('../../../hooks/useSpeechToText', () => ({
  useSpeechToText: () => ({ isListening: false, start: jest.fn(), stop: jest.fn() }),
}));
jest.mock('../../../hooks/useTextToSpeech', () => ({
  useTextToSpeech: () => ({ isSpeaking: false, speak: jest.fn(), stop: jest.fn() }),
}));

import ChatScreen from '../chat';

describe('ChatScreen', () => {
  beforeEach(() => {
    mockSendMessage.mockClear();
    mockStartNewConversation.mockClear();
    mockPush.mockClear();
    mockConversations = [];
    mockActiveId = null;
  });

  it('sends the typed message and clears the input', async () => {
    render(<ChatScreen />);
    fireEvent.changeText(screen.getByTestId('chat-input'), 'hello world');
    fireEvent.press(screen.getByTestId('send-button'));
    await waitFor(() => expect(mockSendMessage).toHaveBeenCalledWith('hello world', 'en'));
    expect(screen.getByTestId('chat-input').props.value).toBe('');
  });

  it('renders existing messages for the active conversation', () => {
    mockActiveId = 'c1';
    mockConversations = [
      {
        id: 'c1',
        title: 'hi',
        language: 'en',
        updatedAt: 1,
        messages: [
          { id: 'm1', role: 'user', text: 'hi', timestamp: 1 },
          { id: 'm2', role: 'assistant', text: 'stub reply', timestamp: 2 },
        ],
      },
    ];
    render(<ChatScreen />);
    expect(screen.getByText('hi')).toBeTruthy();
    expect(screen.getByText('stub reply')).toBeTruthy();
  });

  it('opens the menu and New Chat starts a new conversation', async () => {
    render(<ChatScreen />);
    fireEvent.press(screen.getByTestId('menu-button'));
    await waitFor(() => expect(screen.getByTestId('menu-new-chat')).toBeTruthy());
    fireEvent.press(screen.getByTestId('menu-new-chat'));
    await waitFor(() => expect(mockStartNewConversation).toHaveBeenCalledWith('en'));
  });

  it('opens the menu and History navigates to /(main)/history', async () => {
    render(<ChatScreen />);
    fireEvent.press(screen.getByTestId('menu-button'));
    await waitFor(() => expect(screen.getByTestId('menu-history')).toBeTruthy());
    fireEvent.press(screen.getByTestId('menu-history'));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/(main)/history'));
  });
});
