import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../constants/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  languageName: string;
  onNewChat: () => void;
  onHistory: () => void;
  onSettings: () => void;
};

const screenWidth = Dimensions.get('window').width;
const drawerWidth = screenWidth * 0.75;

export default function SlideMenu({ isOpen, onClose, languageName, onNewChat, onHistory, onSettings }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const { t } = useLanguage();
  const translateX = useRef(new Animated.Value(-drawerWidth)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: isOpen ? 0 : -drawerWidth,
        tension: 120,
        friction: 14,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: isOpen ? 1 : 0,
        duration: isOpen ? 140 : 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen, opacity, translateX]);

  const runThenClose = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <View pointerEvents={isOpen ? 'auto' : 'none'} style={styles.absoluteWrap}>
      <Pressable onPress={onClose} style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.overlay, { opacity }]} />
      </Pressable>
      <Animated.View
        style={[
          styles.drawer,
          { backgroundColor: colors.card, opacity, transform: [{ translateX }], width: drawerWidth },
        ]}
      >
        <View style={{ padding: spacing.md, paddingTop: insets.top + spacing.md }}>
          <Text style={[styles.languageName, { color: colors.text }]}>{languageName}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <TouchableOpacity
          testID="menu-new-chat"
          style={styles.row}
          onPress={() => runThenClose(onNewChat)}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.text} />
          <Text style={[styles.rowLabel, { color: colors.text }]}>{t('newChat')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="menu-history"
          style={styles.row}
          onPress={() => runThenClose(onHistory)}
        >
          <Ionicons name="time-outline" size={20} color={colors.text} />
          <Text style={[styles.rowLabel, { color: colors.text }]}>{t('history')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="menu-settings"
          style={styles.row}
          onPress={() => runThenClose(onSettings)}
        >
          <Ionicons name="settings-outline" size={20} color={colors.text} />
          <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settings')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  absoluteWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  drawer: { position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 1000 },
  languageName: { fontSize: 16, fontWeight: '700' },
  divider: { height: 1, marginHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: 16 },
  rowLabel: { fontSize: 15, marginLeft: 16 },
});
