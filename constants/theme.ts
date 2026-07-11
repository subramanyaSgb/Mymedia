// Stremio-inspired dark tokens: pitch-black base with a purple accent.
// Single source of truth — screens import from here, never hardcode hex/spacing.

export const colors = {
  // Surfaces — pitch black base, subtle raised layers
  bg: '#000000', // app background (true black)
  surface: '#0f0f12', // cards, rows
  surfaceHi: '#1a1a1f', // raised / pressed / inputs
  border: '#26262c',

  // Text
  text: '#f5f5f7', // primary
  textMuted: '#a0a0aa', // secondary (meets AA on black)
  textFaint: '#6a6a72', // tertiary / disabled

  // Accent — Stremio purple/violet
  accent: '#8c5cff',
  accentDim: '#1c1330', // accent tint surface
  onAccent: '#ffffff', // text on accent

  // Status
  success: '#4ade80',
  danger: '#f87171',

  // Poster placeholder
  posterBg: '#141418',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

// Type scale — weights carry hierarchy (per design guidance: control with weight, not just size).
export const type = {
  display: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  h1: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  h2: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '500' },
  bodyStrong: { fontSize: 15, fontWeight: '700' },
  caption: { fontSize: 13, fontWeight: '500' },
  micro: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
} as const;

// Display font (loaded in _layout). Applied to headings via the Text component.
export const fonts = {
  display: 'SpaceGrotesk_700Bold',
  displayBold: 'SpaceGrotesk_700Bold',
} as const;
