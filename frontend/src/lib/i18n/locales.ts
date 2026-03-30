export type UILocale = 'en' | 'hi' | 'bn' | 'or';

export const UI_LOCALE_STORAGE_KEY = 'emotisense-ui-lang';

export const UI_LOCALES: { id: UILocale; nativeLabel: string; englishLabel: string }[] = [
  { id: 'en', nativeLabel: 'English', englishLabel: 'English' },
  { id: 'hi', nativeLabel: 'हिन्दी', englishLabel: 'Hindi' },
  { id: 'bn', nativeLabel: 'বাংলা', englishLabel: 'Bengali' },
  { id: 'or', nativeLabel: 'ଓଡ଼ିଆ', englishLabel: 'Odia' },
];

export function parseStoredLocale(value: string | null): UILocale | null {
  if (value === 'en' || value === 'hi' || value === 'bn' || value === 'or') return value;
  return null;
}
