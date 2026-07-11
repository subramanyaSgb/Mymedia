import { parseMetadata, updateItem } from '@/db/queries';
import type { Item } from '@/db/schema';
import { fetchJikanRuntime } from './jikan';
import { fetchTmdbRuntime } from './tmdb';

// When an item is marked Finished, fetch its runtime (search results don't include it)
// and store it in metadata so Hours Logged is accurate. No-op if already known or manual.
export async function ensureRuntime(item: Item): Promise<void> {
  const meta = parseMetadata(item.metadata);
  if (meta.runtime || !item.sourceId) return; // already have it, or manual entry

  let minutes: number | null = null;
  if (item.source === 'tmdb') {
    minutes = await fetchTmdbRuntime(item.category === 'movie' ? 'movie' : 'series', item.sourceId);
  } else if (item.source === 'jikan') {
    minutes = await fetchJikanRuntime(item.sourceId);
  }
  if (minutes) {
    await updateItem(item.id, { metadata: JSON.stringify({ ...meta, runtime: minutes }) });
  }
}
