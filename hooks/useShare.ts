"use client";

import { useCallback } from "react";
import { useToast } from "./useToast";

export function useShare() {
  const { show } = useToast();
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  const share = useCallback(
    async (data: { title: string; url: string }) => {
      if (canShare) {
        try {
          await navigator.share({
            title: data.title,
            text: "Check out this GIF",
            url: data.url,
          });
          return;
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
        }
      }
      try {
        await navigator.clipboard.writeText(data.url);
        show("Link copied");
      } catch {
        show("Failed to share", "error");
      }
    },
    [canShare, show]
  );

  return { canShare, share };
}
