// store/__tests__/chatStore.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChatStore } from '../chatStore';
import { getAIResponse } from '../../services/ai';

jest.mock('../../services/ai', () => ({
  getAIResponse: jest.fn(() => Promise.resolve('stub reply')),
}));

const CHAT_HISTORY_KEY = 'chatHistory';

describe('chatStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useChatStore.setState({ conversations: [], activeConversationId: null, hydrated: false });
    (getAIResponse as jest.Mock).mockClear();
  });

  it('starts empty and unhydrated', () => {
    const state = useChatStore.getState();
    expect(state.conversations).toEqual([]);
    expect(state.activeConversationId).toBeNull();
    expect(state.hydrated).toBe(false);
  });

  it('hydrate() with nothing stored sets hydrated true and conversations empty', async () => {
    await useChatStore.getState().hydrate();
    expect(useChatStore.getState().hydrated).toBe(true);
    expect(useChatStore.getState().conversations).toEqual([]);
  });

  it('hydrate() loads stored conversations', async () => {
    const stored = [{ id: 'c1', title: 'hi', language: 'en', messages: [], updatedAt: 1 }];
    await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(stored));
    await useChatStore.getState().hydrate();
    expect(useChatStore.getState().conversations).toEqual(stored);
    expect(useChatStore.getState().hydrated).toBe(true);
  });

  it('startNewConversation creates and activates an empty conversation, and persists it', () => {
    const id = useChatStore.getState().startNewConversation('en');
    const state = useChatStore.getState();
    expect(state.activeConversationId).toBe(id);
    expect(state.conversations).toHaveLength(1);
    expect(state.conversations[0]).toMatchObject({ id, title: '', language: 'en', messages: [] });
  });

  it('sendMessage auto-creates a conversation, appends user + assistant messages, and titles it', async () => {
    await useChatStore.getState().sendMessage('hello world', 'en');
    const state = useChatStore.getState();
    expect(state.conversations).toHaveLength(1);
    const conversation = state.conversations[0];
    expect(conversation.title).toBe('hello world');
    expect(conversation.messages).toHaveLength(2);
    expect(conversation.messages[0]).toMatchObject({ role: 'user', text: 'hello world' });
    expect(conversation.messages[1]).toMatchObject({ role: 'assistant', text: 'stub reply' });
    expect(getAIResponse).toHaveBeenCalledWith('hello world', 'en');
  });

  it('sendMessage appends to the existing active conversation without creating a new one', async () => {
    const id = useChatStore.getState().startNewConversation('en');
    await useChatStore.getState().sendMessage('first', 'en');
    await useChatStore.getState().sendMessage('second', 'en');
    const state = useChatStore.getState();
    expect(state.conversations).toHaveLength(1);
    expect(state.conversations[0].id).toBe(id);
    expect(state.conversations[0].messages).toHaveLength(4);
  });

  it('loadConversation sets activeConversationId without creating a new conversation', () => {
    const id = useChatStore.getState().startNewConversation('en');
    useChatStore.getState().startNewConversation('en');
    useChatStore.getState().loadConversation(id);
    expect(useChatStore.getState().activeConversationId).toBe(id);
    expect(useChatStore.getState().conversations).toHaveLength(2);
  });

  it('persists conversations to AsyncStorage after sendMessage', async () => {
    await useChatStore.getState().sendMessage('persisted?', 'en');
    const raw = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].messages).toHaveLength(2);
  });
});
