// TMDB watch-provider id → app/site to open. Android App Links route these
// URLs into the installed app; otherwise the browser opens.
// Providers can't deep-link to a specific title (no public JustWatch API).
export const PROVIDER_LINKS: Record<number, { name: string; url: string }> = {
  8: { name: 'Netflix', url: 'https://www.netflix.com' },
  9: { name: 'Prime Video', url: 'https://www.primevideo.com' },
  119: { name: 'Prime Video', url: 'https://www.primevideo.com' },
  122: { name: 'JioHotstar', url: 'https://www.hotstar.com/in' },
  2336: { name: 'JioHotstar', url: 'https://www.hotstar.com/in' },
  220: { name: 'JioCinema', url: 'https://www.jiocinema.com' },
  232: { name: 'Zee5', url: 'https://www.zee5.com' },
  237: { name: 'Sony LIV', url: 'https://www.sonyliv.com' },
  532: { name: 'Aha', url: 'https://www.aha.video' },
  309: { name: 'Sun NXT', url: 'https://www.sunnxt.com' },
  350: { name: 'Apple TV+', url: 'https://tv.apple.com' },
  2: { name: 'Apple TV', url: 'https://tv.apple.com' },
  192: { name: 'YouTube', url: 'https://www.youtube.com' },
  3: { name: 'Google Play Movies', url: 'https://play.google.com/store/movies' },
  11: { name: 'MUBI', url: 'https://mubi.com' },
  515: { name: 'MX Player', url: 'https://www.mxplayer.in' },
  1898: { name: 'Amazon MiniTV', url: 'https://www.amazon.in/minitv' },
};
