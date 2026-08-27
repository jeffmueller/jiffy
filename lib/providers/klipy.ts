import { GifItem } from "@/lib/types";
import { GifProvider, SearchResult, TrendingResult } from "./types";

const APP_KEY = process.env.KLIPY_APP_KEY;
const BASE_URL = "https://api.klipy.com/api/v1";
const CUSTOMER_ID = "jiffy-user";

interface KlipyMediaFormat {
  url: string;
  width: number;
  height: number;
  size: number;
}

interface KlipyFile {
  hd?: Record<string, KlipyMediaFormat>;
  md?: Record<string, KlipyMediaFormat>;
  sm?: Record<string, KlipyMediaFormat>;
  xs?: Record<string, KlipyMediaFormat>;
}

interface KlipyItem {
  id: number | string;
  title?: string;
  slug?: string;
  file: KlipyFile;
}

function mapItem(item: KlipyItem): GifItem {
  const file = item.file;
  return {
    id: `klipy-${item.id}`,
    title: item.title || "",
    source: "klipy",
    gifUrl: file.hd?.gif?.url || file.md?.gif?.url || "",
    tinyGifUrl: file.sm?.gif?.url || file.xs?.gif?.url || "",
    mp4Url: file.hd?.mp4?.url || file.md?.mp4?.url || "",
    tinyMp4Url: file.sm?.mp4?.url || file.xs?.mp4?.url || "",
    width: file.hd?.gif?.width || file.md?.gif?.width || 0,
    height: file.hd?.gif?.height || file.md?.gif?.height || 0,
  };
}

export class KlipyProvider implements GifProvider {
  name = "klipy";

  async search(query: string, limit = 20, cursor?: string): Promise<SearchResult> {
    if (!APP_KEY) return { results: [], next: "" };

    const page = cursor ? parseInt(cursor, 10) : 1;
    const params = new URLSearchParams({
      q: query,
      per_page: String(limit),
      page: String(page),
      customer_id: CUSTOMER_ID,
    });

    const res = await fetch(`${BASE_URL}/${APP_KEY}/gifs/search?${params}`);
    if (!res.ok) {
      console.error(`Klipy search failed: ${res.status}`);
      return { results: [], next: "" };
    }

    const json = await res.json();
    const data = json.data;
    const items: KlipyItem[] = data?.data || [];
    const hasNext = data?.has_next ?? false;
    const currentPage = data?.current_page ?? page;

    return {
      results: items.map(mapItem),
      next: hasNext ? String(currentPage + 1) : "",
    };
  }

  async trending(limit = 20): Promise<TrendingResult> {
    if (!APP_KEY) return { gifs: [], terms: [], next: "" };

    const params = new URLSearchParams({
      per_page: String(limit),
      customer_id: CUSTOMER_ID,
    });

    const res = await fetch(`${BASE_URL}/${APP_KEY}/gifs/trending?${params}`);
    if (!res.ok) {
      console.error(`Klipy trending failed: ${res.status}`);
      return { gifs: [], terms: [], next: "" };
    }

    const json = await res.json();
    const data = json.data;
    const items: KlipyItem[] = data?.data || [];
    const hasNext = data?.has_next ?? false;

    return {
      gifs: items.map(mapItem),
      terms: [],
      next: hasNext ? "2" : "",
    };
  }

  async autocomplete(query: string): Promise<string[]> {
    if (!APP_KEY) return [];

    const res = await fetch(
      `${BASE_URL}/${APP_KEY}/autocomplete/${encodeURIComponent(query)}?limit=5`
    );
    if (!res.ok) return [];

    const json = await res.json();
    return json.data || [];
  }

  async getById(id: string): Promise<GifItem | null> {
    if (!APP_KEY) return null;

    // Strip the "klipy-" prefix if present
    const klipyId = id.replace(/^klipy-/, "");

    // Unlike search and trending, this returns the item directly under `data`
    // rather than nested in `data.data`.
    const res = await fetch(`${BASE_URL}/${APP_KEY}/gifs/${encodeURIComponent(klipyId)}`);
    if (!res.ok) return null;

    const json = await res.json();
    return json.data?.file ? mapItem(json.data) : null;
  }
}
