import type { Category, Status } from '@/db/schema';

export const CATEGORIES: { key: Category; label: string; icon: string; api: boolean }[] = [
  { key: 'movie', label: 'Movies', icon: '🎬', api: true },
  { key: 'series', label: 'Series', icon: '📺', api: true },
  { key: 'anime', label: 'Anime', icon: '🌸', api: true },
  { key: 'song', label: 'Songs', icon: '🎵', api: false },
];

export const CATEGORY_LABEL: Record<Category, string> = {
  movie: 'Movie',
  series: 'Series',
  anime: 'Anime',
  song: 'Song',
};

export const STATUSES: { key: Status; label: string }[] = [
  { key: 'want', label: 'Want to Watch' },
  { key: 'watching', label: 'Currently Watching' },
  { key: 'finished', label: 'Finished' },
];

export const STATUS_LABEL: Record<Status, string> = {
  want: 'Want to Watch',
  watching: 'Watching',
  finished: 'Finished',
};
