// PopTime design tokens (from github.com/subramanyaSgb/poptime) in two schemes:
// light = the template's exact look; dark = pitch-black base with the same red/amber accents.
// Color consumers use useColors()/useThemedStyles() from components/ui — never import a palette directly.

export type Palette = {
  bg: string;
  surface: string;
  surfaceHi: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string; // poptime red #E42F08
  accentDim: string; // accent tint surface
  onAccent: string;
  accent2: string; // poptime amber #FFAF00
  onAccent2: string;
  navy: string; // poptime deep navy — hero overlays, tags
  overlay: string; // scrim over hero/poster imagery
  success: string;
  danger: string;
  posterBg: string;
};

export const palettes: Record<'light' | 'dark', Palette> = {
  // Exact poptime: white page, light-blue surfaces, red primary, amber secondary.
  light: {
    bg: '#ffffff',
    surface: '#DCEBFD',
    surfaceHi: '#cbdffc',
    border: '#E6E6E6',
    text: '#020B10',
    textMuted: '#797494',
    textFaint: '#a7a3bd',
    accent: '#E42F08',
    accentDim: '#FCE0D9',
    onAccent: '#ffffff',
    accent2: '#FFAF00',
    onAccent2: '#020B10',
    navy: '#0C153B',
    overlay: 'rgba(12,21,59,0.55)',
    success: '#00B894',
    danger: '#EA4C62',
    posterBg: '#e9f2fe',
  },
  // Pitch-black variant (user preference) with poptime's accent system.
  dark: {
    bg: '#000000',
    surface: '#0f0f12',
    surfaceHi: '#1a1a1f',
    border: '#26262c',
    text: '#f5f5f7',
    textMuted: '#a0a0aa',
    textFaint: '#6a6a72',
    accent: '#E42F08',
    accentDim: '#2b0d04',
    onAccent: '#ffffff',
    accent2: '#FFAF00',
    onAccent2: '#020B10',
    navy: '#0C153B',
    overlay: 'rgba(0,0,0,0.55)',
    success: '#00B894',
    danger: '#EA4C62',
    posterBg: '#141418',
  },
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// Poptime is pill-heavy: buttons/inputs/badges are full pills, cards 16.
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

// Roboto is Android's system font, so poptime typography needs no font loading.
export const type = {
  display: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  h1: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  h2: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  body: { fontSize: 14, fontWeight: '400' },
  bodyStrong: { fontSize: 14, fontWeight: '700' },
  caption: { fontSize: 13, fontWeight: '500' },
  micro: { fontSize: 11, fontWeight: '500', letterSpacing: 0.3 },
  kicker: { fontSize: 12, fontWeight: '500', letterSpacing: 0.8 },
} as const;

// Rotating poptime category-badge colors (red / green / amber), keyed by index.
export const badgeColors = ['#E42F08', '#00B894', '#FFAF00'] as const;
