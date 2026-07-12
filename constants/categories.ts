import type { IconName } from '@/components/ui';
import type { Category, Status } from '@/db/schema';

// `icon` is an Ionicons name (real tintable icons, no emoji).
export const CATEGORIES: { key: Category; label: string; icon: IconName; api: boolean }[] = [
  { key: 'movie', label: 'Movies', icon: 'film', api: true },
  { key: 'series', label: 'Series', icon: 'tv', api: true },
  { key: 'anime', label: 'Anime', icon: 'sparkles', api: true },
  { key: 'song', label: 'Songs', icon: 'musical-notes', api: true },
  { key: 'book', label: 'Books', icon: 'book-outline', api: false },
  { key: 'game', label: 'Games', icon: 'game-controller-outline', api: true },
];

export const CATEGORY_ICON: Record<Category, IconName> = {
  movie: 'film',
  series: 'tv',
  anime: 'sparkles',
  song: 'musical-notes',
  book: 'book-outline',
  game: 'game-controller-outline',
};

export const CATEGORY_LABEL: Record<Category, string> = {
  movie: 'Movie',
  series: 'Series',
  anime: 'Anime',
  song: 'Song',
  book: 'Book',
  game: 'Game',
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

// Per-status icon (was a single pushpin for all three).
export const STATUS_ICON: Record<Status, IconName> = {
  want: 'bookmark-outline',
  watching: 'play-circle',
  finished: 'checkmark-done-circle',
};
