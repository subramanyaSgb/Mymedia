// ISO 639-1 → display name. Order = filter chip order (user watches Indian
// multi-language + anime, so those lead).
export const LANGUAGES: { code: string; label: string }[] = [
  { code: 'te', label: 'Telugu' },
  { code: 'ta', label: 'Tamil' },
  { code: 'hi', label: 'Hindi' },
  { code: 'en', label: 'English' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
];

export const LANGUAGE_LABEL: Record<string, string> = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l.label])
);

export const languageName = (code?: string | null): string | null =>
  code ? (LANGUAGE_LABEL[code] ?? code.toUpperCase()) : null;
