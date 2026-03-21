import { GifItem } from "@/lib/types";

export interface SearchResult {
  results: GifItem[];
  next: string;
}

export interface TrendingResult {
  gifs: GifItem[];
  terms: string[];
  next: string;
}

export interface GifProvider {
  name: string;
  search(query: string, limit: number, cursor?: string): Promise<SearchResult>;
  trending(limit: number): Promise<TrendingResult>;
  autocomplete(query: string): Promise<string[]>;
  getById(id: string): Promise<GifItem | null>;
}
