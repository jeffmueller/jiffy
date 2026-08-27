"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
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

/**
 * Distribute items into columns, shortest column first, estimating each item's
 * height from its aspect ratio.
 *
 * This is a pure function of (results, columnCount). Assignment walks the list
 * in order, so appending items leaves every earlier item exactly where it was
 * — which is what stops the grid reshuffling as infinite scroll loads more.
 * Recomputing the whole layout is cheap; doing it incrementally meant mutating
 * refs during render, which could assign the same items twice when React
 * re-ran a render.
 */
function useStableColumns(results: GifItem[], columnCount: number) {
  return useMemo(() => {
    const columns: GifItem[][] = Array.from({ length: columnCount }, () => []);
    const heights = new Array<number>(columnCount).fill(0);

    for (const gif of results) {
      const aspect = gif.width && gif.height ? gif.width / gif.height : 1;

      let shortest = 0;
      for (let c = 1; c < columnCount; c++) {
        if (heights[c] < heights[shortest]) shortest = c;
      }

      columns[shortest].push(gif);
      heights[shortest] += 1 / aspect;
    }

    return columns;
  }, [results, columnCount]);
}

function useColumnCount() {
  const [count, setCount] = useState(2);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w >= 1024) setCount(4);
      else if (w >= 768) setCount(3);
      else setCount(2);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
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
  const columnCount = useColumnCount();
  const columns = useStableColumns(results, columnCount);

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

  // Track a global index across columns for staggered animation
  let globalIndex = 0;

  return (
    <>
      <div className="flex gap-4">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-1 flex-col gap-4">
            {column.map((gif) => {
              const idx = globalIndex++;
              return (
                <GifCard
                  key={gif.id}
                  gif={gif}
                  index={idx}
                  onClick={() => handleCardClick(gif)}
                  showSource={showSource}
                />
              );
            })}
          </div>
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
