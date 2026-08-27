"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  Link as LinkIcon,
  ShareNetwork,
  Image as ImageIcon,
} from "@phosphor-icons/react";
import { GifItem } from "@/lib/types";
import { useClipboard } from "@/hooks/useClipboard";
import { useShare } from "@/hooks/useShare";

export function GifDetailPage({ gif }: { gif: GifItem }) {
  const { copyUrl, copyImage } = useClipboard();
  const { share } = useShare();
  const [videoFailed, setVideoFailed] = useState(false);
  const [providers, setProviders] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/providers")
      .then((r) => r.json())
      .then((d) => setProviders(d.providers || []))
      .catch(() => {});
  }, []);

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="flex min-h-[100dvh] flex-col items-center bg-background">
      <header className="sticky top-0 z-30 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 md:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft weight="bold" className="h-4 w-4" />
            Back to search
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-6 px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="w-full overflow-hidden rounded-[2rem] bg-zinc-100 dark:bg-zinc-800 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)]"
        >
          {!videoFailed && gif.mp4Url ? (
            <video
              src={gif.mp4Url}
              autoPlay
              loop
              muted
              playsInline
              onError={() => setVideoFailed(true)}
              className="w-full"
            />
          ) : (
            <img src={gif.gifUrl} alt={gif.title} className="w-full" />
          )}
        </motion.div>

        {gif.title && (
          <p className="text-center text-base text-muted">{gif.title}</p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 25 }}
          className="flex flex-wrap justify-center gap-2"
        >
          <button
            onClick={() => copyUrl(gif.gifUrl)}
            className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform active:scale-[0.98]"
          >
            <LinkIcon weight="bold" className="h-4 w-4" />
            Copy URL
          </button>

          <button
            onClick={() => copyImage(gif.gifUrl)}
            className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98]"
          >
            <ImageIcon weight="bold" className="h-4 w-4" />
            Copy image
          </button>

          <button
            onClick={() => copyUrl(shareUrl)}
            className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98]"
          >
            <Copy weight="bold" className="h-4 w-4" />
            Copy link
          </button>

          <button
            onClick={() =>
              share({
                title: gif.title || "Check out this GIF",
                url: shareUrl,
              })
            }
            className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98]"
          >
            <ShareNetwork weight="bold" className="h-4 w-4" />
            Share
          </button>
        </motion.div>
      </main>

      {providers.length > 0 && (
        <footer className="border-t border-border/50 py-4 text-center text-xs text-muted">
          Powered by {providers.join(" & ")}
        </footer>
      )}
    </div>
  );
}
