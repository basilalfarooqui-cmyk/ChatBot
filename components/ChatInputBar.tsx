import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../constants/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onMicPress: () => void;
  micEnabled: boolean;
  isListening: boolean;
};

export default function ChatInputBar({
  value,
  onChangeText,
  onSend,
  onMicPress,
  micEnabled,
  isListening,
}: Props) {
  const { colors, radius, spacing } = useTheme();
  const { t } = useLanguage();
  const canSend = value.trim().length > 0;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderRadius: radius.input, margin: spacing.sm, padding: spacing.xs },
      ]}
    >
      <TextInput
        testID="chat-input"
        style={[styles.input, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={t('inputPlaceholder')}
        placeholderTextColor={colors.muted}
        multiline
      />
      <TouchableOpacity
        testID="mic-button"
        onPress={onMicPress}
        disabled={!micEnabled}
        style={styles.iconButton}
      >
        <Ionicons
          name={isListening ? 'mic' : 'mic-outline'}
          size={22}
          color={micEnabled ? colors.accent : colors.disabled}
        />
      </TouchableOpacity>
      <TouchableOpacity
        testID="send-button"
        onPress={onSend}
        disabled={!canSend}
        style={styles.iconButton}
      >
        <Ionicons name="send" size={20} color={canSend ? colors.accent : colors.disabled} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end' },
  input: { flex: 1, maxHeight: 100, paddingHorizontal: 8 },
  iconButton: { padding: 8 },
});
