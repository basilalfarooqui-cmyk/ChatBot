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
let mockIsSending = false;

jest.mock('../../../store/chatStore', () => ({
  useChatStore: (selector: any) =>
    selector({
      conversations: mockConversations,
      activeConversationId: mockActiveId,
      sendMessage: mockSendMessage,
      startNewConversation: mockStartNewConversation,
      isSending: mockIsSending,
    }),
}));

jest.mock('../../../hooks/useVoiceAvailability', () => ({
  useVoiceAvailability: () => ({ sttAvailable: true, ttsAvailable: true, checked: true }),
}));

const mockSpeak = jest.fn(() => Promise.resolve(true));
const mockStopSpeaking = jest.fn(() => Promise.resolve());
let mockIsSpeaking = false;

jest.mock('../../../hooks/useSpeechToText', () => ({
  useSpeechToText: () => ({ isListening: false, isTranscribing: false, start: jest.fn(), stop: jest.fn() }),
}));
jest.mock('../../../hooks/useTextToSpeech', () => ({
  useTextToSpeech: () => ({ isSpeaking: mockIsSpeaking, speak: mockSpeak, stop: mockStopSpeaking }),
}));

import ChatScreen from '../chat';

describe('ChatScreen', () => {
  beforeEach(() => {
    mockSendMessage.mockClear();
    mockStartNewConversation.mockClear();
    mockPush.mockClear();
    mockSpeak.mockClear();
    mockStopSpeaking.mockClear();
    mockConversations = [];
    mockActiveId = null;
    mockIsSending = false;
    mockIsSpeaking = false;
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

  it('shows the thinking indicator while a message is sending', () => {
    mockIsSending = true;
    render(<ChatScreen />);
    expect(screen.getByTestId('thinking-indicator')).toBeTruthy();
  });

  it('does not show the thinking indicator when not sending', () => {
    mockIsSending = false;
    render(<ChatScreen />);
    expect(screen.queryByTestId('thinking-indicator')).toBeNull();
  });

  it('tapping play on an assistant message starts speaking it', () => {
    mockActiveId = 'c1';
    mockConversations = [
      {
        id: 'c1',
        title: 'hi',
        language: 'en',
        updatedAt: 1,
        messages: [{ id: 'm1', role: 'assistant', text: 'stub reply', timestamp: 1 }],
      },
    ];
    render(<ChatScreen />);
    fireEvent.press(screen.getByTestId('play-button'));
    expect(mockSpeak).toHaveBeenCalled();
  });

  it('tapping play again on the currently-speaking message stops it instead of restarting', () => {
    mockActiveId = 'c1';
    mockConversations = [
      {
        id: 'c1',
        title: 'hi',
        language: 'en',
        updatedAt: 1,
        messages: [{ id: 'm1', role: 'assistant', text: 'stub reply', timestamp: 1 }],
      },
    ];
    render(<ChatScreen />);
    fireEvent.press(screen.getByTestId('play-button'));
    mockSpeak.mockClear();
    fireEvent.press(screen.getByTestId('play-button'));
    expect(mockStopSpeaking).toHaveBeenCalled();
    expect(mockSpeak).not.toHaveBeenCalled();
  });
});
