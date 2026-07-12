// fetch with timeout + retry on transient failures (5xx, 429, network/timeout).
// Jikan's free API 504s often, so retries make anime search usable.
export async function fetchRetry(url: string, init?: RequestInit, tries = 3, timeoutMs = 12000): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < tries; attempt++) {
    if (attempt > 0) await sleep(600 * attempt); // backoff: 0, 600, 1200ms
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: ctrl.signal });
      clearTimeout(timer);
      if (res.status >= 500 || res.status === 429) {
        lastErr = new Error(`HTTP ${res.status}`);
        continue; // transient — retry
      }
      return res;
    } catch (e) {
      clearTimeout(timer);
      lastErr = e; // network error or timeout — retry
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Request failed');
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
