"use client";

const HEIGHTS = [180, 240, 200, 260, 220, 190, 250, 210, 230, 200, 180, 240];

export function LoadingSkeleton() {
  return (
    <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
      {HEIGHTS.map((h, i) => (
        <div
          key={i}
          className="mb-4 break-inside-avoid animate-pulse rounded-2xl bg-zinc-200/60 dark:bg-zinc-800/60"
          style={{ height: h }}
        />
      ))}
    </div>
  );
}
