import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from './translations';

export const APP_LANGUAGE_KEY = 'appLanguage';
export const DEFAULT_LANGUAGE = 'en';

type LanguageContextType = {
  languageCode: string;
  ready: boolean;
  t: (key: string) => string;
  setLanguage: (code: string) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType>({
  languageCode: DEFAULT_LANGUAGE,
  ready: false,
  t: key => translations[DEFAULT_LANGUAGE][key] ?? key,
  setLanguage: async () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [languageCode, setLanguageCode] = useState(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(APP_LANGUAGE_KEY).then(stored => {
      if (!mounted) return;
      if (stored) setLanguageCode(stored);
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = useCallback(async (code: string) => {
    await AsyncStorage.setItem(APP_LANGUAGE_KEY, code);
    setLanguageCode(code);
  }, []);

  const t = useCallback(
    (key: string) => {
      const dict = translations[languageCode] ?? translations[DEFAULT_LANGUAGE];
      return dict[key] ?? translations[DEFAULT_LANGUAGE][key] ?? key;
    },
    [languageCode]
  );

  return (
    <LanguageContext.Provider value={{ languageCode, ready, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
