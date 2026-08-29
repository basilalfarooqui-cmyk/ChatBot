import { FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../constants/ThemeContext';
import { LANGUAGES } from '../i18n/languages';

type Props = {
  onSelect: (code: string) => void;
};

export default function LanguagePickerGrid({ onSelect }: Props) {
  const { colors, radius, spacing } = useTheme();

  return (
    <FlatList
      data={LANGUAGES}
      keyExtractor={item => item.code}
      numColumns={2}
      initialNumToRender={LANGUAGES.length}
      contentContainerStyle={{ padding: spacing.md }}
      renderItem={({ item }) => (
        <TouchableOpacity
          testID={`lang-card-${item.code}`}
          onPress={() => onSelect(item.code)}
          style={[
            styles.card,
            { backgroundColor: colors.card, borderRadius: radius.card, margin: spacing.xs },
          ]}
        >
          <Text style={[styles.native, { color: colors.text }]}>{item.nativeName}</Text>
          <Text style={[styles.english, { color: colors.muted }]}>{item.englishName}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  native: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  english: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
});
