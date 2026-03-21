import { GifItem } from "@/lib/types";
import { GifProvider, SearchResult, TrendingResult } from "./types";

const API_KEY = process.env.GIPHY_API_KEY;
const BASE_URL = "https://api.giphy.com/v1";

interface GiphyImages {
  original?: { url?: string; width?: string; height?: string; mp4?: string };
  fixed_height?: { url?: string; width?: string; height?: string; mp4?: string };
  fixed_height_small?: { url?: string; width?: string; height?: string; mp4?: string };
  preview?: { mp4?: string; width?: string; height?: string };
}

interface GiphyItem {
  id: string;
  title?: string;
  images: GiphyImages;
}

function mapItem(item: GiphyItem): GifItem {
  const imgs = item.images;
  return {
    id: `giphy-${item.id}`,
    title: item.title || "",
    source: "giphy",
    gifUrl: imgs.original?.url || imgs.fixed_height?.url || "",
    tinyGifUrl: imgs.fixed_height_small?.url || imgs.fixed_height?.url || "",
    mp4Url: imgs.original?.mp4 || imgs.fixed_height?.mp4 || "",
    tinyMp4Url: imgs.preview?.mp4 || imgs.fixed_height_small?.mp4 || "",
    width: parseInt(imgs.original?.width || imgs.fixed_height?.width || "0", 10),
    height: parseInt(imgs.original?.height || imgs.fixed_height?.height || "0", 10),
  };
}

export class GiphyProvider implements GifProvider {
  name = "giphy";

  async search(query: string, limit = 20, cursor?: string): Promise<SearchResult> {
    if (!API_KEY) return { results: [], next: "" };

    const offset = cursor ? parseInt(cursor, 10) : 0;
    const params = new URLSearchParams({
      api_key: API_KEY,
      q: query,
      limit: String(limit),
      offset: String(offset),
      rating: "pg-13",
    });

    const res = await fetch(`${BASE_URL}/gifs/search?${params}`);
    if (!res.ok) {
      console.error(`Giphy search failed: ${res.status}`);
      return { results: [], next: "" };
    }

    const json = await res.json();
    const items: GiphyItem[] = json.data || [];
    const pagination = json.pagination || {};
    const nextOffset = offset + items.length;
    const hasMore = nextOffset < (pagination.total_count || 0) && nextOffset < 5000;

    return {
      results: items.map(mapItem),
      next: hasMore ? String(nextOffset) : "",
    };
  }

  async trending(limit = 20): Promise<TrendingResult> {
    if (!API_KEY) return { gifs: [], terms: [], next: "" };

    const params = new URLSearchParams({
      api_key: API_KEY,
      limit: String(limit),
      rating: "pg-13",
    });

    const res = await fetch(`${BASE_URL}/gifs/trending?${params}`);
    if (!res.ok) {
      console.error(`Giphy trending failed: ${res.status}`);
      return { gifs: [], terms: [], next: "" };
    }

    const json = await res.json();
    const items: GiphyItem[] = json.data || [];

    return {
      gifs: items.map(mapItem),
      terms: [],
      next: "",
    };
  }

  async autocomplete(query: string): Promise<string[]> {
    if (!API_KEY) return [];

    const params = new URLSearchParams({
      api_key: API_KEY,
      q: query,
      limit: "5",
    });

    const res = await fetch(`${BASE_URL}/gifs/search/tags?${params}`);
    if (!res.ok) return [];

    const json = await res.json();
    return (json.data || []).map((tag: { name: string }) => tag.name);
  }

  async getById(id: string): Promise<GifItem | null> {
    if (!API_KEY) return null;

    // Strip the "giphy-" prefix if present
    const giphyId = id.replace(/^giphy-/, "");
    const params = new URLSearchParams({
      api_key: API_KEY,
      gif_id: giphyId,
    });

    const res = await fetch(`${BASE_URL}/gifs/${giphyId}?${params}`);
    if (!res.ok) return null;

    const json = await res.json();
    return json.data ? mapItem(json.data) : null;
  }
}
