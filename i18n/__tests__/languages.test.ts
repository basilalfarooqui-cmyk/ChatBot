import { LANGUAGES, VOICE_RELIABLE_CODES } from '../languages';

describe('languages metadata', () => {
  it('has exactly 23 entries', () => {
    expect(LANGUAGES).toHaveLength(23);
  });

  it('every entry has code, nativeName, englishName', () => {
    LANGUAGES.forEach(lang => {
      expect(typeof lang.code).toBe('string');
      expect(lang.code.length).toBeGreaterThan(0);
      expect(typeof lang.nativeName).toBe('string');
      expect(typeof lang.englishName).toBe('string');
    });
  });

  it('has no duplicate codes', () => {
    const codes = LANGUAGES.map(l => l.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('Hindi has voiceLocale hi-IN', () => {
    expect(LANGUAGES.find(l => l.code === 'hi')?.voiceLocale).toBe('hi-IN');
  });

  it('Santali has no voiceLocale', () => {
    expect(LANGUAGES.find(l => l.code === 'sat')?.voiceLocale).toBeUndefined();
  });

  it('Odia has a voiceLocale but is not in the reliable whitelist', () => {
    expect(LANGUAGES.find(l => l.code === 'or')?.voiceLocale).toBe('or-IN');
    expect(VOICE_RELIABLE_CODES).not.toContain('or');
  });

  it('VOICE_RELIABLE_CODES has exactly the 11 spec languages', () => {
    expect(VOICE_RELIABLE_CODES.sort()).toEqual(
      ['hi', 'en', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'ur'].sort()
    );
  });
});
