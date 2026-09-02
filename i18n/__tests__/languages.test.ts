import { LANGUAGES } from '../languages';

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

});
