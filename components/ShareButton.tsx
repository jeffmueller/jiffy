"use client";

import { ShareNetwork } from "@phosphor-icons/react";
import { useShare } from "@/hooks/useShare";

interface ShareButtonProps {
  title: string;
  url: string;
  className?: string;
}

export function ShareButton({ title, url, className = "" }: ShareButtonProps) {
  const { share } = useShare();

  return (
    <button
      onClick={() => share({ title, url })}
      className={`flex items-center gap-1.5 rounded-full bg-zinc-900/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-all hover:bg-zinc-900/90 active:scale-[0.98] ${className}`}
    >
      <ShareNetwork weight="bold" className="h-3.5 w-3.5" />
    </button>
  );
}
