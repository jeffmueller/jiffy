"use client";

import { Ghost } from "@phosphor-icons/react";

export function EmptyState({ query }: { query?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Ghost weight="thin" className="mb-4 h-16 w-16 text-zinc-300 dark:text-zinc-600" />
      <p className="text-lg font-medium text-zinc-400 dark:text-zinc-500">
        {query ? `Nothing found for "${query}"` : "Nothing here yet"}
      </p>
      <p className="mt-1 text-sm text-muted">Try a different search term</p>
    </div>
  );
}
