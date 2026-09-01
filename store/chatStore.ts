import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAIResponse } from '../services/ai';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
};

export type Conversation = {
  id: string;
  title: string;
  language: string;
  messages: ChatMessage[];
  updatedAt: number;
};

type ChatState = {
  conversations: Conversation[];
  activeConversationId: string | null;
  hydrated: boolean;
  isSending: boolean;
  hydrate: () => Promise<void>;
  startNewConversation: (language: string) => string;
  sendMessage: (text: string, language: string) => Promise<void>;
  loadConversation: (id: string) => void;
};

const CHAT_HISTORY_KEY = 'chatHistory';

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function persist(conversations: Conversation[]): Promise<void> {
  await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(conversations));
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  hydrated: false,
  isSending: false,

  hydrate: async () => {
    const raw = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
    const conversations: Conversation[] = raw ? JSON.parse(raw) : [];
    set({ conversations, hydrated: true });
  },

  startNewConversation: language => {
    const id = makeId();
    const conversation: Conversation = {
      id,
      title: '',
      language,
      messages: [],
      updatedAt: Date.now(),
    };
    const conversations = [...get().conversations, conversation];
    set({ conversations, activeConversationId: id });
    void persist(conversations);
    return id;
  },

  sendMessage: async (text, language) => {
    let activeId = get().activeConversationId;
    let conversations = get().conversations;

    if (!activeId || !conversations.some(c => c.id === activeId)) {
      activeId = makeId();
      conversations = [
        ...conversations,
        { id: activeId, title: '', language, messages: [], updatedAt: Date.now() },
      ];
    }

    const userMessage: ChatMessage = {
      id: makeId(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    conversations = conversations.map(c => {
      if (c.id !== activeId) return c;
      const title = c.title || text.slice(0, 40);
      return { ...c, title, messages: [...c.messages, userMessage], updatedAt: Date.now() };
    });

    set({ conversations, activeConversationId: activeId, isSending: true });
    void persist(conversations);

    try {
      const reply = await getAIResponse(text, language);

      const assistantMessage: ChatMessage = {
        id: makeId(),
        role: 'assistant',
        text: reply,
        timestamp: Date.now(),
      };

      conversations = get().conversations.map(c =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, assistantMessage], updatedAt: Date.now() }
          : c
      );

      set({ conversations });
      void persist(conversations);
    } finally {
      set({ isSending: false });
    }
  },

  loadConversation: id => {
    set({ activeConversationId: id });
  },
}));
