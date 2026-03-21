"use client";

import { useCallback, useEffect, useState } from "react";
import { SearchBar } from "./SearchBar";
import { TrendingPills } from "./TrendingPills";
import { GifGrid } from "./GifGrid";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { useSearch } from "@/hooks/useSearch";
import { ThemeToggle } from "./ThemeToggle";
import { GifItem } from "@/lib/types";

export function HomeContent() {
  const { results, status, query, next, search, loadMore, reset } = useSearch();
  const [trendingGifs, setTrendingGifs] = useState<GifItem[]>([]);
  const [trendingTerms, setTrendingTerms] = useState<string[]>([]);
  const [trendingNext, setTrendingNext] = useState("");
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [providers, setProviders] = useState<string[]>([]);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [trendingRes, providersRes] = await Promise.all([
          fetch("/api/trending"),
          fetch("/api/providers"),
        ]);
        const trendingData = await trendingRes.json();
        const providersData = await providersRes.json();
        setTrendingGifs(trendingData.gifs || []);
        setTrendingTerms(trendingData.terms || []);
        setTrendingNext(trendingData.next || "");
        setProviders(providersData.providers || []);
      } catch {
        // Failed silently
      } finally {
        setTrendingLoading(false);
      }
    }
    fetchInitialData();
  }, []);

  const handleSearch = useCallback(
    (q: string) => {
      search(q);
    },
    [search]
  );

  const handlePillSelect = useCallback(
    (term: string) => {
      search(term);
    },
    [search]
  );

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  const isSearching = status !== "idle";
  const showResults = isSearching ? results : trendingGifs;
  const showStatus = isSearching ? status : trendingLoading ? "loading" : "loaded";
  const showNext = isSearching ? next : trendingNext;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:px-8">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Jiffy
            </h1>
            <div className="flex-1">
              <SearchBar onSearch={handleSearch} onReset={handleReset} />
            </div>
            <ThemeToggle />
          </div>
          {!isSearching && (
            <TrendingPills terms={trendingTerms} onSelect={handlePillSelect} />
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8">
        {trendingLoading && !isSearching ? (
          <LoadingSkeleton />
        ) : (
          <GifGrid
            results={showResults}
            status={showStatus}
            query={query}
            hasMore={!!showNext}
            onLoadMore={loadMore}
            onRetry={() => search(query)}
          />
        )}
      </main>

      {providers.length > 0 && (
        <footer className="border-t border-border/50 py-4 text-center text-xs text-muted">
          Powered by {providers.join(" & ")}
        </footer>
      )}
    </div>
  );
}
