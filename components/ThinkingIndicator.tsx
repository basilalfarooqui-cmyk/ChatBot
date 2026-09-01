import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../constants/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';

const STATUS_KEYS = ['thinking', 'searchingDocuments', 'checkingGuidelines'] as const;
const CYCLE_MS = 1600;

type Props = {
  visible: boolean;
};

export default function ThinkingIndicator({ visible }: Props) {
  const { colors, radius, spacing } = useTheme();
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) {
      setStep(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setStep(prev => (prev + 1) % STATUS_KEYS.length);
    }, CYCLE_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.row} testID="thinking-indicator">
      <View
        style={[
          styles.bubble,
          { backgroundColor: colors.card, borderRadius: radius.bubble, padding: spacing.sm, marginHorizontal: spacing.md },
        ]}
      >
        <Text style={{ color: colors.muted }}>{t(STATUS_KEYS[step])}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'flex-start', marginVertical: 4 },
  bubble: { maxWidth: '80%' },
});
