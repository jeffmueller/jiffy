"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
 * Distribute items into columns using a shortest-column-first approach.
 * Each item is assigned once based on its aspect ratio (height estimate).
 * Items stay in their assigned column when new items are appended.
 */
function useStableColumns(results: GifItem[], columnCount: number) {
  const columnsRef = useRef<GifItem[][]>([]);
  const assignedCountRef = useRef(0);
  const prevColumnCountRef = useRef(columnCount);
  const prevResultsIdRef = useRef<string | null>(null);

  return useMemo(() => {
    // Detect if results were replaced (new search) vs appended (load more)
    // by checking if existing items shifted
    const firstResultId = results.length > 0 ? results[0].id : null;
    const isNewSearch =
      firstResultId !== prevResultsIdRef.current ||
      columnCount !== prevColumnCountRef.current;

    if (isNewSearch) {
      columnsRef.current = Array.from({ length: columnCount }, () => []);
      assignedCountRef.current = 0;
      prevResultsIdRef.current = firstResultId;
      prevColumnCountRef.current = columnCount;
    }

    // Ensure we have the right number of columns
    while (columnsRef.current.length < columnCount) {
      columnsRef.current.push([]);
    }

    // Track estimated height per column for shortest-first assignment
    const heights = columnsRef.current.map((col) =>
      col.reduce((h, gif) => {
        const aspect = gif.width && gif.height ? gif.width / gif.height : 1;
        return h + 1 / aspect;
      }, 0)
    );

    // Assign only new items (from assignedCountRef onward)
    for (let i = assignedCountRef.current; i < results.length; i++) {
      const gif = results[i];
      const aspect = gif.width && gif.height ? gif.width / gif.height : 1;

      // Find the shortest column
      let shortest = 0;
      for (let c = 1; c < columnCount; c++) {
        if (heights[c] < heights[shortest]) shortest = c;
      }

      columnsRef.current[shortest].push(gif);
      heights[shortest] += 1 / aspect;
    }

    assignedCountRef.current = results.length;

    // Return a new array reference so React re-renders
    return columnsRef.current.map((col) => [...col]);
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
