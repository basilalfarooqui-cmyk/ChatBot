import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
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
  isTranscribing?: boolean;
};

export default function ChatInputBar({
  value,
  onChangeText,
  onSend,
  onMicPress,
  micEnabled,
  isListening,
  isTranscribing = false,
}: Props) {
  const { colors, radius, spacing } = useTheme();
  const { t } = useLanguage();
  const canSend = value.trim().length > 0;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isListening) {
      pulse.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.35, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();

    return () => loop.stop();
  }, [isListening, pulse]);

  const micIconName = isTranscribing ? 'sync' : isListening ? 'mic' : 'mic-outline';
  const micColor = micEnabled ? colors.accent : colors.disabled;

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
        placeholder={isTranscribing ? t('transcribing') : t('inputPlaceholder')}
        placeholderTextColor={colors.muted}
        editable={!isTranscribing}
        multiline
      />
      <TouchableOpacity
        testID="mic-button"
        onPress={onMicPress}
        disabled={!micEnabled || isTranscribing}
        style={styles.iconButton}
      >
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <Ionicons name={micIconName} size={22} color={micColor} />
        </Animated.View>
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
