"use client";

import { Warning } from "@phosphor-icons/react";

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Warning weight="thin" className="mb-4 h-16 w-16 text-zinc-300 dark:text-zinc-600" />
      <p className="text-lg font-medium text-zinc-400 dark:text-zinc-500">Something went wrong</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-transform active:scale-[0.98]"
        >
          Try again
        </button>
      )}
    </div>
  );
}
