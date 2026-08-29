import { translations } from '../translations';

const FULL_LANGUAGES = ['en', 'hi', 'te', 'ta', 'bn', 'mr', 'gu', 'kn'];
const KEYS = [
  'chatTitle', 'inputPlaceholder', 'newChat', 'history', 'settings',
  'changeLanguage', 'about', 'version', 'backendNote', 'voiceUnavailableNote',
  'noHistory', 'languageSelectTitle', 'historyTitle', 'settingsTitle', 'listening',
];

describe('translations', () => {
  it('has an entry for all 23 language codes', () => {
    expect(Object.keys(translations)).toHaveLength(23);
  });

  it.each(FULL_LANGUAGES)('%s has every UI key populated (non-empty)', code => {
    KEYS.forEach(key => {
      expect(translations[code][key]).toBeTruthy();
    });
  });

  it.each(FULL_LANGUAGES)('%s has exactly the same key set as English', code => {
    expect(Object.keys(translations[code]).sort()).toEqual(
      Object.keys(translations.en).sort()
    );
  });

  it('a non-fully-translated language (Odia) exists but is empty', () => {
    expect(translations.or).toEqual({});
  });
});
