"use client";

import { useState, useCallback, useMemo } from "react";
import { GifItem } from "@/lib/types";
import { GifCard } from "./GifCard";
import { GifDetail } from "./GifDetail";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

interface GifGridProps {
  results: GifItem[];
  status: "idle" | "loading" | "loaded" | "error" | "empty";
  query: string;
  hasMore: boolean;
  onLoadMore: () => void;
  onRetry?: () => void;
}

export function GifGrid({
  results,
  status,
  query,
  hasMore,
  onLoadMore,
  onRetry,
}: GifGridProps) {
  const [selectedGif, setSelectedGif] = useState<GifItem | null>(null);

  // Only show source badges when results come from multiple providers
  const showSource = useMemo(() => {
    if (results.length === 0) return false;
    const sources = new Set(results.map((g) => g.source));
    return sources.size > 1;
  }, [results]);

  const sentinelRef = useInfiniteScroll(
    onLoadMore,
    status === "loaded" && hasMore
  );

  const handleCardClick = useCallback((gif: GifItem) => {
    setSelectedGif(gif);
  }, []);

  if (status === "loading" && results.length === 0) {
    return <LoadingSkeleton />;
  }

  if (status === "empty") {
    return <EmptyState query={query} />;
  }

  if (status === "error" && results.length === 0) {
    return <ErrorState onRetry={onRetry} />;
  }

  if (results.length === 0 && status === "idle") {
    return null;
  }

  return (
    <>
      <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
        {results.map((gif, i) => (
          <GifCard
            key={gif.id}
            gif={gif}
            index={i}
            onClick={() => handleCardClick(gif)}
            showSource={showSource}
          />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-accent" />
        </div>
      )}

      {selectedGif && (
        <GifDetail gif={selectedGif} onClose={() => setSelectedGif(null)} />
      )}
    </>
  );
}
