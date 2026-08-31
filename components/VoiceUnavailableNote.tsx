import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../constants/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';

type Props = {
  visible: boolean;
};

export default function VoiceUnavailableNote({ visible }: Props) {
  const { colors, radius, spacing } = useTheme();
  const { t } = useLanguage();

  if (!visible) return null;

  return (
    <View
      testID="voice-unavailable-note"
      style={[
        styles.container,
        { backgroundColor: colors.noteBg, borderRadius: radius.card, margin: spacing.sm, padding: spacing.sm },
      ]}
    >
      <Text style={[styles.text, { color: colors.noteText }]}>{t('voiceUnavailableNote')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  text: { fontSize: 12 },
});
