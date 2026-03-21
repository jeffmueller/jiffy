"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Link as LinkIcon, ShareNetwork, Image as ImageIcon } from "@phosphor-icons/react";
import { GifItem } from "@/lib/types";
import { useClipboard } from "@/hooks/useClipboard";
import { useShare } from "@/hooks/useShare";

interface GifDetailProps {
  gif: GifItem;
  onClose: () => void;
}

export function GifDetail({ gif, onClose }: GifDetailProps) {
  const { copyUrl, copyImage } = useClipboard();
  const { share } = useShare();
  const [videoFailed, setVideoFailed] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/gif/${gif.id}`
      : "";

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose]
  );

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleOverlayClick}
        className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-900/80 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="relative flex max-h-[90vh] max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-surface shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900/60 text-white backdrop-blur-sm transition-all hover:bg-zinc-900/80 active:scale-[0.92]"
          >
            <X weight="bold" className="h-4 w-4" />
          </button>

          <div className="relative max-h-[70vh] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
            {!videoFailed && gif.mp4Url ? (
              <video
                src={gif.mp4Url}
                autoPlay
                loop
                muted
                playsInline
                onError={() => setVideoFailed(true)}
                className="max-h-[70vh] w-full object-contain"
              />
            ) : (
              <img
                src={gif.gifUrl}
                alt={gif.title}
                className="max-h-[70vh] w-full object-contain"
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 p-5">
            <button
              onClick={() => copyUrl(gif.gifUrl)}
              className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-transform active:scale-[0.98]"
            >
              <LinkIcon weight="bold" className="h-4 w-4" />
              Copy URL
            </button>

            <button
              onClick={() => copyImage(gif.gifUrl)}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98]"
            >
              <ImageIcon weight="bold" className="h-4 w-4" />
              Copy image
            </button>

            <button
              onClick={() => copyUrl(shareUrl)}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98]"
            >
              <Copy weight="bold" className="h-4 w-4" />
              Copy link
            </button>

            <button
              onClick={() =>
                share({ title: gif.title || "Check out this GIF", url: shareUrl })
              }
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98]"
            >
              <ShareNetwork weight="bold" className="h-4 w-4" />
              Share
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
