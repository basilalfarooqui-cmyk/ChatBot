import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../constants/ThemeContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useChatStore } from '../../store/chatStore';

export default function HistoryScreen() {
  const { colors, spacing } = useTheme();
  const { t } = useLanguage();
  const conversations = useChatStore(s => s.conversations);
  const loadConversation = useChatStore(s => s.loadConversation);

  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  const openConversation = (id: string) => {
    loadConversation(id);
    router.push('/(main)/chat');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, padding: spacing.md }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('historyTitle')}</Text>
      {sorted.length === 0 ? (
        <Text testID="history-empty" style={[styles.empty, { color: colors.muted }]}>
          {t('noHistory')}
        </Text>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`history-item-${item.id}`}
              style={[styles.row, { borderBottomColor: colors.border }]}
              onPress={() => openConversation(item.id)}
            >
              <Text style={[styles.rowTitle, { color: colors.text }]}>{item.title || t('newChat')}</Text>
              <Text style={[styles.rowDate, { color: colors.muted }]}>
                {new Date(item.updatedAt).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  empty: { fontSize: 14, textAlign: 'center', marginTop: 40 },
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowDate: { fontSize: 11, marginTop: 2 },
});
