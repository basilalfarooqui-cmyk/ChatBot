import { useEffect } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useTheme } from '../constants/ThemeContext';
import { APP_LANGUAGE_KEY } from '../i18n/LanguageContext';

export default function Index() {
  const { colors } = useTheme();

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(APP_LANGUAGE_KEY).then(stored => {
      if (!mounted) return;
      router.replace(stored ? '/(main)/chat' : '/language-select');
    });
    return () => {
      mounted = false;
    };
  }, []);

  return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
}
