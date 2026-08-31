import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));

jest.mock('../../../i18n/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k }),
}));

const mockLoadConversation = jest.fn();
let mockConversations: any[] = [];

jest.mock('../../../store/chatStore', () => ({
  useChatStore: (selector: any) =>
    selector({ conversations: mockConversations, loadConversation: mockLoadConversation }),
}));

import HistoryScreen from '../history';

describe('HistoryScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockLoadConversation.mockClear();
    mockConversations = [];
  });

  it('shows the empty state when there are no conversations', () => {
    render(<HistoryScreen />);
    expect(screen.getByTestId('history-empty')).toBeTruthy();
  });

  it('lists conversations sorted by most recently updated first', () => {
    mockConversations = [
      { id: 'a', title: 'older', language: 'en', messages: [], updatedAt: 1 },
      { id: 'b', title: 'newer', language: 'en', messages: [], updatedAt: 2 },
    ];
    render(<HistoryScreen />);
    const items = screen.getAllByTestId(/^history-item-/);
    expect(items[0].props.testID).toBe('history-item-b');
    expect(items[1].props.testID).toBe('history-item-a');
  });

  it('tapping a conversation loads it and navigates to chat', () => {
    mockConversations = [{ id: 'a', title: 'hello', language: 'en', messages: [], updatedAt: 1 }];
    render(<HistoryScreen />);
    fireEvent.press(screen.getByTestId('history-item-a'));
    expect(mockLoadConversation).toHaveBeenCalledWith('a');
    expect(mockPush).toHaveBeenCalledWith('/(main)/chat');
  });
});
