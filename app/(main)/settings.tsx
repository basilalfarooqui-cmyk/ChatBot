import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useTheme } from '../../constants/ThemeContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { LANGUAGES } from '../../i18n/languages';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, radius, spacing } = useTheme();
  const { t, languageCode } = useLanguage();
  const languageInfo = LANGUAGES.find(l => l.code === languageCode);
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.bg, padding: spacing.md, paddingTop: insets.top + spacing.md },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>{t('settingsTitle')}</Text>

      <TouchableOpacity
        testID="change-language-row"
        style={[styles.row, { backgroundColor: colors.card, borderRadius: radius.card, padding: spacing.md }]}
        onPress={() => router.push({ pathname: '/language-select', params: { from: 'settings' } })}
      >
        <Text style={{ color: colors.text }}>{t('changeLanguage')}</Text>
        <Text style={{ color: colors.muted }}>{languageInfo?.nativeName ?? languageCode}</Text>
      </TouchableOpacity>

      <View style={[styles.aboutSection, { marginTop: spacing.lg }]}>
        <Text style={[styles.aboutHeader, { color: colors.text }]}>{t('about')}</Text>
        <Text style={{ color: colors.muted, marginTop: spacing.xs }}>
          {t('version')}: {appVersion}
        </Text>
        <Text testID="backend-note" style={{ color: colors.muted, marginTop: spacing.xs }}>
          {t('backendNote')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aboutSection: {},
  aboutHeader: { fontSize: 15, fontWeight: '700' },
});
