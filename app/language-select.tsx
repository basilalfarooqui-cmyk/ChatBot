import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../constants/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import LanguagePickerGrid from '../components/LanguagePickerGrid';

export default function LanguageSelectScreen() {
  const { colors, spacing } = useTheme();
  const { setLanguage, t } = useLanguage();
  const { from } = useLocalSearchParams<{ from?: string }>();

  const handleSelect = async (code: string) => {
    await setLanguage(code);
    if (from === 'settings') {
      router.back();
    } else {
      router.replace('/(main)/chat');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text, padding: spacing.md }]}>
        {t('languageSelectTitle')}
      </Text>
      <LanguagePickerGrid onSelect={handleSelect} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700' },
});
