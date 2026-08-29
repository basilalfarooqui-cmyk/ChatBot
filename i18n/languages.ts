export type LanguageInfo = {
  code: string;
  nativeName: string;
  englishName: string;
  voiceLocale?: string;
};

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', nativeName: 'English', englishName: 'English', voiceLocale: 'en-IN' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi', voiceLocale: 'hi-IN' },
  { code: 'bn', nativeName: 'বাংলা', englishName: 'Bengali', voiceLocale: 'bn-IN' },
  { code: 'te', nativeName: 'తెలుగు', englishName: 'Telugu', voiceLocale: 'te-IN' },
  { code: 'mr', nativeName: 'मराठी', englishName: 'Marathi', voiceLocale: 'mr-IN' },
  { code: 'ta', nativeName: 'தமிழ்', englishName: 'Tamil', voiceLocale: 'ta-IN' },
  { code: 'ur', nativeName: 'اردو', englishName: 'Urdu', voiceLocale: 'ur-IN' },
  { code: 'gu', nativeName: 'ગુજરાતી', englishName: 'Gujarati', voiceLocale: 'gu-IN' },
  { code: 'kn', nativeName: 'ಕನ್ನಡ', englishName: 'Kannada', voiceLocale: 'kn-IN' },
  { code: 'ml', nativeName: 'മലയാളം', englishName: 'Malayalam', voiceLocale: 'ml-IN' },
  { code: 'pa', nativeName: 'ਪੰਜਾਬੀ', englishName: 'Punjabi', voiceLocale: 'pa-IN' },
  { code: 'or', nativeName: 'ଓଡ଼ିଆ', englishName: 'Odia', voiceLocale: 'or-IN' },
  { code: 'as', nativeName: 'অসমীয়া', englishName: 'Assamese', voiceLocale: 'as-IN' },
  { code: 'ne', nativeName: 'नेपाली', englishName: 'Nepali', voiceLocale: 'ne-NP' },
  { code: 'mai', nativeName: 'मैथिली', englishName: 'Maithili' },
  { code: 'sat', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', englishName: 'Santali' },
  { code: 'ks', nativeName: 'كٲشُر', englishName: 'Kashmiri' },
  { code: 'kok', nativeName: 'कोंकणी', englishName: 'Konkani' },
  { code: 'sd', nativeName: 'سنڌي', englishName: 'Sindhi' },
  { code: 'doi', nativeName: 'डोगरी', englishName: 'Dogri' },
  { code: 'mni', nativeName: 'ꯃꯤꯇꯩꯂꯣꯟ', englishName: 'Manipuri (Meitei)' },
  { code: 'brx', nativeName: 'बड़ो', englishName: 'Bodo' },
  { code: 'sa', nativeName: 'संस्कृतम्', englishName: 'Sanskrit' },
];

export const VOICE_RELIABLE_CODES: string[] = [
  'hi', 'en', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'ur',
];
