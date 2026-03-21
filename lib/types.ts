export type GifSource = "klipy" | "giphy";

export interface GifItem {
  id: string;
  title: string;
  source: GifSource;
  gifUrl: string;
  tinyGifUrl: string;
  mp4Url: string;
  tinyMp4Url: string;
  width: number;
  height: number;
}

export interface SearchResponse {
  results: GifItem[];
  next: string;
}

export interface AutocompleteResponse {
  suggestions: string[];
}

export interface TrendingResponse {
  gifs: GifItem[];
  terms: string[];
  next: string;
}
