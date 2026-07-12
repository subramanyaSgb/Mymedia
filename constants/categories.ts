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

// Category-appropriate status vocabulary. Same 3 DB states, different verbs.
// `hideMiddle` collapses the "in progress" state for categories where it makes
// no sense (songs/books have no "listening now"/"reading now" tracking value here).
type StatusVocab = {
  want: string;
  watching: string;
  finished: string;
  short: Record<Status, string>; // uppercase segmented-control labels
  verbFor: 'watch' | 'listen' | 'read' | 'play';
};

const WATCH_VOCAB: StatusVocab = {
  want: 'Want to Watch',
  watching: 'Watching',
  finished: 'Watched',
  short: { want: 'WANT', watching: 'WATCHING', finished: 'WATCHED' },
  verbFor: 'watch',
};

export const CATEGORY_STATUS: Record<Category, StatusVocab> = {
  movie: WATCH_VOCAB,
  series: WATCH_VOCAB,
  anime: WATCH_VOCAB,
  song: {
    want: 'Want to Listen',
    watching: 'Listening',
    finished: 'Saved',
    short: { want: 'WANT', watching: 'LISTENING', finished: 'SAVED' },
    verbFor: 'listen',
  },
  book: {
    want: 'Want to Read',
    watching: 'Reading',
    finished: 'Read',
    short: { want: 'WANT', watching: 'READING', finished: 'READ' },
    verbFor: 'read',
  },
  game: {
    want: 'Want to Play',
    watching: 'Playing',
    finished: 'Played',
    short: { want: 'WANT', watching: 'PLAYING', finished: 'PLAYED' },
    verbFor: 'play',
  },
};

// Categories where the middle "in progress" state is hidden (collapse to want/done).
export const HIDES_MIDDLE_STATUS: Record<Category, boolean> = {
  movie: false,
  series: false,
  anime: false,
  song: true, // Saved vs Want — no "listening now"
  book: false,
  game: false,
};

export function statusLabel(category: Category, status: Status): string {
  return CATEGORY_STATUS[category][status];
}

export function statuses(category: Category): { key: Status; label: string }[] {
  const v = CATEGORY_STATUS[category];
  const all: { key: Status; label: string }[] = [
    { key: 'want', label: v.want },
    { key: 'watching', label: v.watching },
    { key: 'finished', label: v.finished },
  ];
  return HIDES_MIDDLE_STATUS[category] ? all.filter((s) => s.key !== 'watching') : all;
}

// Per-status icon (was a single pushpin for all three).
export const STATUS_ICON: Record<Status, IconName> = {
  want: 'bookmark-outline',
  watching: 'play-circle',
  finished: 'checkmark-done-circle',
};
