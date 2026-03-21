import { GifItem } from "@/lib/types";
import { GifProvider, SearchResult, TrendingResult } from "./types";
import { KlipyProvider } from "./klipy";
import { GiphyProvider } from "./giphy";

/**
 * Interleave arrays: [A1, B1, A2, B2, A3, B3, ...]
 * If one array is longer, remaining items go at the end.
 */
function interleave<T>(arrays: T[][]): T[] {
  const result: T[] = [];
  const maxLen = Math.max(...arrays.map((a) => a.length));
  for (let i = 0; i < maxLen; i++) {
    for (const arr of arrays) {
      if (i < arr.length) result.push(arr[i]);
    }
  }
  return result;
}

function getActiveProviders(): GifProvider[] {
  const providers: GifProvider[] = [];
  if (process.env.KLIPY_APP_KEY) providers.push(new KlipyProvider());
  if (process.env.GIPHY_API_KEY) providers.push(new GiphyProvider());
  return providers;
}

export async function searchGifs(
  query: string,
  limit = 20,
  cursor?: string
): Promise<SearchResult> {
  const providers = getActiveProviders();
  if (providers.length === 0) return { results: [], next: "" };

  // Split the limit across providers
  const perProvider = Math.ceil(limit / providers.length);

  // Parse per-provider cursors from a combined cursor like "klipy:2|giphy:40"
  const cursors = parseCursors(cursor);

  const settled = await Promise.allSettled(
    providers.map((p) => p.search(query, perProvider, cursors[p.name]))
  );

  const allResults: GifItem[][] = [];
  const nextParts: string[] = [];

  settled.forEach((result, i) => {
    if (result.status === "fulfilled") {
      allResults.push(result.value.results);
      if (result.value.next) {
        nextParts.push(`${providers[i].name}:${result.value.next}`);
      }
    }
  });

  return {
    results: interleave(allResults),
    next: nextParts.length > 0 ? nextParts.join("|") : "",
  };
}

export async function getTrending(limit = 20): Promise<TrendingResult> {
  const providers = getActiveProviders();
  if (providers.length === 0) return { gifs: [], terms: [], next: "" };

  const perProvider = Math.ceil(limit / providers.length);

  const settled = await Promise.allSettled(
    providers.map((p) => p.trending(perProvider))
  );

  const allGifs: GifItem[][] = [];
  const allTerms: string[] = [];

  settled.forEach((result) => {
    if (result.status === "fulfilled") {
      allGifs.push(result.value.gifs);
      allTerms.push(...result.value.terms);
    }
  });

  // Dedupe terms
  const uniqueTerms = [...new Set(allTerms)];

  return {
    gifs: interleave(allGifs),
    terms: uniqueTerms,
    next: "",
  };
}

export async function getAutocomplete(query: string): Promise<string[]> {
  const providers = getActiveProviders();
  if (providers.length === 0) return [];

  const settled = await Promise.allSettled(
    providers.map((p) => p.autocomplete(query))
  );

  const all: string[] = [];
  settled.forEach((result) => {
    if (result.status === "fulfilled") {
      all.push(...result.value);
    }
  });

  // Dedupe and limit
  return [...new Set(all)].slice(0, 8);
}

export async function getGifById(id: string): Promise<GifItem | null> {
  const providers = getActiveProviders();

  // Try to route to the right provider based on the ID prefix
  for (const provider of providers) {
    if (id.startsWith(`${provider.name}-`)) {
      return provider.getById(id);
    }
  }

  // Fallback: try all providers
  for (const provider of providers) {
    const result = await provider.getById(id);
    if (result) return result;
  }

  return null;
}

function parseCursors(cursor?: string): Record<string, string> {
  if (!cursor) return {};
  const result: Record<string, string> = {};
  for (const part of cursor.split("|")) {
    const [name, value] = part.split(":");
    if (name && value) result[name] = value;
  }
  return result;
}
