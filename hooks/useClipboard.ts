"use client";

import { useCallback } from "react";
import { useToast } from "./useToast";

export function useClipboard() {
  const { show } = useToast();

  const copyUrl = useCallback(
    async (url: string) => {
      try {
        await navigator.clipboard.writeText(url);
        show("GIF URL copied");
        return true;
      } catch {
        show("Failed to copy", "error");
        return false;
      }
    },
    [show]
  );

  const copyImage = useCallback(
    (imageUrl: string) => {
      if (typeof ClipboardItem === "undefined") {
        return copyUrl(imageUrl);
      }

      // Write HTML with an <img> tag so rich-text apps (iMessage, Slack, Discord)
      // render the animated GIF. Include plain text URL as fallback.
      const htmlBlob = new Blob(
        [`<img src="${imageUrl}" />`],
        { type: "text/html" }
      );
      const textBlob = new Blob([imageUrl], { type: "text/plain" });

      return navigator.clipboard
        .write([
          new ClipboardItem({
            "text/html": htmlBlob,
            "text/plain": textBlob,
          }),
        ])
        .then(() => {
          show("GIF copied — paste into any chat app");
          return true;
        })
        .catch(() => {
          return copyUrl(imageUrl);
        });
    },
    [show, copyUrl]
  );

  return { copyUrl, copyImage };
}
