import type { NewItem } from '@/db/schema';

// A catalog search hit, already mapped to an insertable item shape (minus status defaults).
export type SearchResult = Omit<NewItem, 'status' | 'favorite'> & { key: string };
