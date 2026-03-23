"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Copy, ShareNetwork } from "@phosphor-icons/react";
import { GifItem } from "@/lib/types";
import { useClipboard } from "@/hooks/useClipboard";
import { useShare } from "@/hooks/useShare";

interface GifCardProps {
  gif: GifItem;
  index: number;
  onClick: () => void;
  showSource?: boolean;
}

export function GifCard({ gif, index, onClick, showSource = true }: GifCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { copyUrl, copyImage } = useClipboard();
  const { share } = useShare();

  const aspectRatio = gif.width && gif.height ? gif.width / gif.height : 1;

  // Single click → open modal (delayed to distinguish from double-click)
  const handleClick = useCallback(() => {
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => {
      onClick();
    }, 250);
  }, [onClick]);

  // Double-click → copy image immediately, cancel the pending single-click
  const handleDoubleClick = useCallback(() => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    copyImage(gif.gifUrl);
  }, [copyImage, gif.gifUrl]);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      copyUrl(gif.gifUrl);
    },
    [copyUrl, gif.gifUrl]
  );

  const handleShare = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      share({
        title: gif.title || "Check out this GIF",
        url: `${window.location.origin}/gif/${gif.id}`,
      });
    },
    [share, gif]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay: (index % 20) * 0.04,
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className="group relative mb-4 cursor-pointer break-inside-avoid overflow-hidden rounded-2xl bg-zinc-200/40 dark:bg-zinc-800/40"
      style={{ aspectRatio }}
    >
      {!videoFailed && gif.tinyMp4Url ? (
        <video
          ref={videoRef}
          src={gif.tinyMp4Url}
          autoPlay
          loop
          muted
          playsInline
          onError={() => setVideoFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <img
          src={gif.tinyGifUrl || gif.gifUrl}
          alt={gif.title}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      {showSource && (
        <span className="absolute left-2 top-2 rounded-full bg-zinc-900/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80 backdrop-blur-sm">
          {gif.source === "giphy" ? "Giphy" : "Klipy"}
        </span>
      )}

      <div className="absolute bottom-2.5 right-2.5 flex gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <button
          onClick={handleCopy}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/70 text-white backdrop-blur-sm transition-all hover:bg-zinc-900/90 active:scale-[0.92]"
          title="Copy GIF URL"
        >
          <Copy weight="bold" className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleShare}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/70 text-white backdrop-blur-sm transition-all hover:bg-zinc-900/90 active:scale-[0.92]"
          title="Share GIF"
        >
          <ShareNetwork weight="bold" className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
