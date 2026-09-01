import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../constants/ThemeContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { LANGUAGES } from '../../i18n/languages';
import { useChatStore } from '../../store/chatStore';
import { useVoiceAvailability } from '../../hooks/useVoiceAvailability';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import ChatBubble from '../../components/ChatBubble';
import ChatInputBar from '../../components/ChatInputBar';
import SlideMenu from '../../components/SlideMenu';
import VoiceUnavailableNote from '../../components/VoiceUnavailableNote';
import ThinkingIndicator from '../../components/ThinkingIndicator';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, languageCode } = useLanguage();

  const conversations = useChatStore(s => s.conversations);
  const activeConversationId = useChatStore(s => s.activeConversationId);
  const sendMessage = useChatStore(s => s.sendMessage);
  const startNewConversation = useChatStore(s => s.startNewConversation);
  const isSending = useChatStore(s => s.isSending);

  const activeConversation = conversations.find(c => c.id === activeConversationId) ?? null;
  const messages = activeConversation?.messages ?? [];

  const [inputText, setInputText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const languageInfo = LANGUAGES.find(l => l.code === languageCode);
  const voiceLocale = languageInfo?.voiceLocale;
  const { sttAvailable, ttsAvailable, checked } = useVoiceAvailability(languageCode, voiceLocale);
  const { isListening, isTranscribing, start: startListening, stop: stopListening } = useSpeechToText(
    voiceLocale,
    text => setInputText(text)
  );
  const { isSpeaking, speak, stop: stopSpeaking } = useTextToSpeech();

  // isSpeaking reflects the hook's own real playback state (from tts-finish/
  // tts-cancel events) -- once it goes false, whichever bubble we marked as
  // speaking is done, regardless of how playback ended.
  useEffect(() => {
    if (!isSpeaking) setSpeakingMessageId(null);
  }, [isSpeaking]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    void sendMessage(text, languageCode);
  }, [inputText, languageCode, sendMessage]);

  const handleMicPress = useCallback(() => {
    if (isListening) {
      void stopListening();
    } else {
      void startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handlePlay = useCallback(
    (messageId: string, text: string) => {
      if (speakingMessageId === messageId) {
        void stopSpeaking();
        return;
      }
      if (!voiceLocale) return;
      setSpeakingMessageId(messageId);
      void speak(text, voiceLocale);
    },
    [speak, stopSpeaking, speakingMessageId, voiceLocale]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity testID="menu-button" onPress={() => setMenuOpen(true)}>
          <Ionicons name="menu" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('chatTitle')}</Text>
        <View style={{ width: 26 }} />
      </View>

      <FlatList
        data={[...messages].reverse()}
        keyExtractor={item => item.id}
        inverted
        renderItem={({ item }) => (
          <ChatBubble
            message={item}
            showPlay={ttsAvailable}
            isSpeaking={speakingMessageId === item.id}
            onPlay={() => handlePlay(item.id, item.text)}
          />
        )}
        ListHeaderComponent={<ThinkingIndicator visible={isSending} />}
        contentContainerStyle={styles.listContent}
      />

      <VoiceUnavailableNote visible={checked && !sttAvailable && !ttsAvailable} />

      <ChatInputBar
        value={inputText}
        onChangeText={setInputText}
        onSend={handleSend}
        onMicPress={handleMicPress}
        micEnabled={checked && sttAvailable}
        isListening={isListening}
        isTranscribing={isTranscribing}
      />

      <SlideMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        languageName={languageInfo?.nativeName ?? languageCode}
        onNewChat={() => startNewConversation(languageCode)}
        onHistory={() => router.push('/(main)/history')}
        onSettings={() => router.push('/(main)/settings')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  listContent: { paddingVertical: 8 },
});
