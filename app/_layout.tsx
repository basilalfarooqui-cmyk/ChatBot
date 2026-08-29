import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from '../constants/ThemeContext';
import { LanguageProvider } from '../i18n/LanguageContext';
import { useChatStore } from '../store/chatStore';

export default function RootLayout() {
  const hydrate = useChatStore(s => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="language-select" />
          <Stack.Screen name="(main)" />
        </Stack>
      </LanguageProvider>
    </ThemeProvider>
  );
}
