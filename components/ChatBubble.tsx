import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../constants/ThemeContext';
import type { ChatMessage } from '../store/chatStore';

type Props = {
  message: ChatMessage;
  showPlay?: boolean;
  onPlay?: () => void;
};

export default function ChatBubble({ message, showPlay, onPlay }: Props) {
  const { colors, radius, spacing } = useTheme();
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.row, { justifyContent: isUser ? 'flex-end' : 'flex-start' }]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.accent : colors.card,
            borderRadius: radius.bubble,
            padding: spacing.sm,
            marginHorizontal: spacing.md,
          },
        ]}
      >
        <Text style={{ color: isUser ? colors.onAccent : colors.text }}>{message.text}</Text>
        <View style={styles.metaRow}>
          <Text
            style={[
              styles.timestamp,
              { color: isUser ? colors.onAccentMuted : colors.muted },
            ]}
          >
            {time}
          </Text>
          {showPlay && !isUser && (
            <TouchableOpacity onPress={onPlay} testID="play-button" style={styles.playButton}>
              <Ionicons name="volume-high" size={14} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 4 },
  bubble: { maxWidth: '80%' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  timestamp: { fontSize: 10 },
  playButton: { marginLeft: 8 },
});
