// Dark-cinematic design tokens. Single source of truth — screens import from here,
// never hardcode hex/spacing. Amber accent evokes cinema and avoids generic AI-purple/blue.

export const colors = {
  // Surfaces (charcoal, not pure black)
  bg: '#0e0f13', // app background
  surface: '#181a20', // cards, rows
  surfaceHi: '#22252e', // raised / pressed / inputs
  border: '#2a2e39',

  // Text
  text: '#f4f5f7', // primary
  textMuted: '#9aa0ad', // secondary (meets AA on bg)
  textFaint: '#6b7280', // tertiary / disabled

  // Accent — warm amber
  accent: '#f5a524',
  accentDim: '#3a2e14', // accent tint surface
  onAccent: '#1a1204', // text on accent

  // Status
  success: '#4ade80',
  danger: '#f87171',

  // Poster placeholder
  posterBg: '#22252e',
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
